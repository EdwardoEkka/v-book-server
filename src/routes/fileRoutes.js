const express = require("express");
const { createFile, getFile, getAllUserFiles } = require("../controllers/fileController");

const router = express.Router();

router.post("/create-file", createFile);
router.get("/get-file/:id", getFile);
router.get("/get-all-files/:id", getAllUserFiles);

module.exports = router;
