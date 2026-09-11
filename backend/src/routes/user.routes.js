const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  inviteUserRules,
  updateUserRules,
} = require("../validators/user.validator");

const router = express.Router();

// All user-management routes are manager-only (Section 7: "User
// management page (admin) - invite/remove team members, assign roles").
router.use(authenticate, authorize("manager"));

router.get("/", userController.listUsers);
router.post('/', inviteUserRules, validate, userController.inviteUser);
// router.post("/", userController.inviteUser);
router.patch("/:id", updateUserRules, validate, userController.updateUser);
router.delete("/:id", userController.removeUser);

module.exports = router;
