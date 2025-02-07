const prisma = require("../prismClient");
const Joi = require("joi");

// Validation schema
const fileSchema = Joi.object({
  fileName: Joi.string().required(),
  content: Joi.string().allow(""),
  parentFolderId: Joi.string().required(),
  userId: Joi.string().required(),
});

const createFile = async (req, res) => {
  const { fileName, content, parentFolderId, userId } = req.body;

  // Validate input
  const { error } = fileSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, error: error.details[0].message });
  }

  try {
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
      const folderNameExists = await prisma.file.findFirst({
        where: { parentFolderId: parentFolderId, fileName: fileName },
      });
      if (folderNameExists != null) {
        return res
          .status(409)
          .json({
            success: false,
            error: "Parent folder has already a file with this name.",
          });
      }
    }

    const file = await prisma.file.create({
      data: { fileName, content, parentFolderId, userId },
    });
    res.status(201).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFile = async (req, res) => {
  const fileId = req.params.id;
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }, // Correctly specify the `where` clause
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    res.status(200).json({success: true, message: 'File Found' ,file});
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getAllUserFiles = async(req,res)=>{
  try {
    const userId = req.params.id;
    const allFiles = await prisma.file.findMany({where:{userId: userId}})
    res.status(200).json({success: true, files: allFiles, message:"Files fetched."})
  } catch (error) {
    res.status(500).json({success: false, error: error.message})
  }
}


module.exports = { createFile, getFile, getAllUserFiles };
