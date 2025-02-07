const express = require("express");
const {
  GetFoldersAndFilesBySearch,
} = require("../controllers/searchController");

const router = express.Router();

router.get("/getSearchResults/:PId/:userId/:searchValue", GetFoldersAndFilesBySearch);

module.exports = router;
