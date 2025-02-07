const prisma = require("../prismClient");
const Joi = require("joi");
const cuid = require("cuid");

// Validation schema
const folderSchema = Joi.object({
  name: Joi.string().required(),
  parentFolderId: Joi.string().allow(null),
});

const createFolder = async (req, res) => {
  const { name, parentFolderId, userId } = req.body;

  // Validate input
  const { error } = folderSchema.validate({ name, parentFolderId });
  if (error) {
    return res
      .status(400)
      .json({ success: false, error: error.details[0].message });
  }

  try {
    // Ensure the parent folder exists and belongs to the same user
    if (parentFolderId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentFolderId },
      });

      if (!parentFolder || parentFolder.userId !== userId) {
        return res
          .status(404)
          .json({
            success: false,
            error: "Parent folder not found or not accessible",
          });
      }
    }

    //Ensure that new folder name is unique under the same user and same parent Folder
    if (parentFolderId) {
      const folderNameExists = await prisma.folder.findFirst({
        where: { parentFolderId: parentFolderId, name: name },
      });
      if (folderNameExists != null) {
        return res
          .status(409)
          .json({
            success: false,
            error: "Parent folder has already a folder with this name.",
          });
      }
    }

    // Create the folder
    const folder = await prisma.folder.create({
      data: { name, parentFolderId, userId }, // Include `userId`
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    if (error.code === "P2002") {
      // Unique constraint error
      res.status(409).json({
        success: false,
        error: "Folder name must be unique within the parent",
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

const getFolderById = async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.params.userId;
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: userId,
      },
      include: {
        files: true, // Include all files in this folder
        subFolders: {
          include: {
            files: false, // Include files in each subfolder
            subFolders: false, // Nested subfolders (recursively fetching can be added here if needed)
          },
        },
      },
    });

    if (!folder) {
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });
    }

    return res.status(200).json({ success: true, folder });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createRootFolder = async (req, res) => {
  const userId = req.params.userId;
  try {
    const rootFolder = await prisma.folder.findUnique({
      where: {
        parentFolderId: null,
        userId: userId,
      },
    });

    if (rootFolder) {
      return res
        .status(200)
        .json({ success: true, rootExists: true, rootFolder });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const userName = user.name.toLocaleLowerCase();
    const newRootFolder = await prisma.folder.create({
      data: {
        name: `${userName}@root`,
        parentFolderId: null,
        userId: userId,
      },
    });

    res
      .status(201)
      .json({ success: true, rootExists: false, rootFolder: newRootFolder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRootFolder = async (req, res) => {
  const userId = req.params.userId;

  try {
    const rootFolder = await prisma.folder.findFirst({
      where: {
        parentFolderId: null,
        userId: userId,
      },
    });
    if (!rootFolder) {
      return res.status(200).json({ success: true, rootExists: false });
    }
    return res
      .status(200)
      .json({ success: true, rootExists: true, rootFolder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllUserFolders = async(req,res)=>{
  try {
    const userId = req.params.id;
    const allFolders = await prisma.folder.findMany({where:{userId: userId}})
    res.status(200).json({success: true, folders: allFolders, message:"Folders fetched."})
  } catch (error) {
    res.status(500).json({success: false, error: error.message})
  }
}

module.exports = {
  createFolder,
  getFolderById,
  getRootFolder,
  createRootFolder,
  getAllUserFolders
};
