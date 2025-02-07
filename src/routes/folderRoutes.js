const express = require("express");
const {
  createFolder,
  getFolderById,
  getRootFolder,
  createRootFolder,
  getAllUserFolders,
} = require("../controllers/folderController");

const router = express.Router();

router.post("/create-folder", createFolder);
router.post("/create-root-folder/:userId", createRootFolder);
router.get("/get-folder-by-id/:id/:userId", getFolderById);
router.get("/get-root-folder/:userId", getRootFolder);
router.get("/get-all-folders/:id", getAllUserFolders);

module.exports = router;
