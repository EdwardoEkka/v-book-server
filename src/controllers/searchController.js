const prisma = require("../prismClient");

const GetFoldersAndFilesBySearch = async (req, res) => {
  try {
    const searchValue = req.params.searchValue;
    const ParentFolderId = req.params.PId;
    const UserId = req.params.UserId;
    const folderResults = [];
    const fileResults = [];

    // Fetch folders matching the search value
    const initialFolderResults = await prisma.folder.findMany({
      where: {
        name: { contains: searchValue, mode: "insensitive" },
        userId: UserId,
      },
    });

    // Filter folders recursively to check the relationship
    for (const folderItem of initialFolderResults) {
      const isRelated = await checkIfFolderOrFileRelated(
        ParentFolderId,
        folderItem.parentFolderId
      );
      if (isRelated) {
        // Build the path up to the parent folder
        const path = await buildFolderPathTillParent(
          folderItem.id,
          ParentFolderId
        );
        folderResults.push({ ...folderItem, path });
      }
    }

    // Fetch files matching the search value
    const initialFileResults = await prisma.file.findMany({
      where: {
        fileName: { contains: searchValue, mode: "insensitive" },
        userId: UserId,
      },
    });

    // Filter files recursively to check the relationship
    for (const fileItem of initialFileResults) {
      const isRelated = await checkIfFolderOrFileRelated(
        ParentFolderId,
        fileItem.parentFolderId
      );
      if (isRelated) {
        const path = await buildFilePathTillParent(fileItem.id, ParentFolderId);
        fileResults.push({ ...fileItem, path });
      }
    }

    if (folderResults.length === 0 && fileResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: `No results for ${searchValue}` });
    }

    return res
      .status(200)
      .json({
        success: true,
        results: { folderResults: folderResults, fileResults: fileResults },
      });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const checkIfFolderOrFileRelated = async (parentFolderId, currentFolderParentId) => {
  if (currentFolderParentId === null) {
    // Reached root folder, no relation found
    return false;
  }
  if (currentFolderParentId === parentFolderId) {
    // Found a direct relationship
    return true;
  }

  // Fetch parent folder details and continue checking
  const parentFolder = await prisma.folder.findUnique({
    where: { id: currentFolderParentId },
    select: { parentFolderId: true },
  });

  // If parent folder doesn't exist, no relationship is found
  if (!parentFolder) {
    return false;
  }

  // Recursively check the next level
  return checkIfFolderOrFileRelated(parentFolderId, parentFolder.parentFolderId);
};

// Helper function to build the folder path till the specified parent folder
const buildFolderPathTillParent = async (folderId, parentFolderId) => {
  const path = [];
  let currentFolderId = folderId;

  while (currentFolderId && currentFolderId !== parentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { id: true, name: true, parentFolderId: true },
    });

    if (!folder) break;
    path.unshift(folder.name); // Add the folder name to the beginning of the path
    currentFolderId = folder.parentFolderId;
  }

  const parentFolder = await prisma.folder.findUnique({
    where: { id: parentFolderId },
    select: { name: true },
  });
  if (parentFolder) {
    path.unshift(parentFolder.name);
  }

  return path.join("/"); // Return the path as a string
};

// Helper function to build the file path till the specified parent folder
const buildFilePathTillParent = async (fileId, parentFolderId) => {
  const path = [];
  
  // Fetch the file to get its parent folder ID
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { parentFolderId: true, fileName: true },
  });

  if (!file) {
    throw new Error("File not found");
  }

  path.unshift(file.fileName); // Add the file name at the end of the path
  let currentFolderId = file.parentFolderId;

  // Traverse up the folder hierarchy until the specified parent folder is reached
  while (currentFolderId && currentFolderId !== parentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { id: true, name: true, parentFolderId: true },
    });

    if (!folder) break;
    path.unshift(folder.name); // Add the folder name to the beginning of the path
    currentFolderId = folder.parentFolderId;
  }

  const parentFolder = await prisma.folder.findUnique({
    where: { id: parentFolderId },
    select: { name: true },
  });

  if (parentFolder) {
    path.unshift(parentFolder.name); // Add the parent folder's name
  }

  return path.join("/"); // Return the path as a string
};

module.exports = { GetFoldersAndFilesBySearch };
