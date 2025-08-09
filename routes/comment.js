// routes/comment.js

const express = require('express');
const authenticate = require('../middleware/verifytoken');

const { validateContent, validateVote, validateCommentIdParam } = require('../middleware/comment/validatecomment');
const handleValidationErrors = require('../middleware/handlevalidationerrors');
const canModifyComment = require('../middleware/comment/canmodifycomment');
const authorize = require('../middleware/authorizerole');

const updateComment = require('../controllers/comments/updatecomment');
const deleteComment = require('../controllers/comments/deletecomment');
const voteOnComment = require('../controllers/comments/voteoncomment');
const toggleCommentApproval = require('../controllers/comments/toggleCommentApproval');

const router = express.Router();

router.put('/:commentId', authenticate, canModifyComment, validateContent, handleValidationErrors, updateComment);

router.delete('/:commentId', authenticate, canModifyComment, deleteComment);

router.post('/:commentId/vote', authenticate, validateCommentIdParam, validateVote, handleValidationErrors, voteOnComment);

router.patch('/:commentId/approve', authenticate, authorize('editor', 'admin', 'superadmin'), toggleCommentApproval
);
module.exports = router;