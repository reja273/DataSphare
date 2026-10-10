const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const MAX_STORY_CONTENT_LENGTH = 3_000_000;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, maxlength: 100 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  excerpt: { type: String, default: '', maxlength: 240 },
  content: { type: String, required: true, maxlength: MAX_STORY_CONTENT_LENGTH },
  tags: [{ type: String, trim: true, maxlength: 32 }],
  isPublic: { type: Boolean, default: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

function readJson() {
  if (!fs.existsSync(DATA_FILE)) {
    writeJson({ users: [], posts: [], comments: [] });
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  data.users ||= [];
  data.posts ||= [];
  data.comments ||= [];
  return data;
}

function writeJson(data) {
  const tempFile = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tempFile, DATA_FILE);
}

function idEq(a, b) {
  return Boolean(a && b) && String(a) === String(b);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function publicPost(post, author, commentCount = 0, liked = false, isFollowingAuthor = false) {
  return {
    id: String(post._id || post.id),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags || [],
    isPublic: post.isPublic !== false,
    author: author ? { id: String(author._id || author.id), name: author.name } : null,
    likeCount: (post.likes || []).length,
    liked,
    isFollowingAuthor,
    commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
}

function publicComment(comment, author) {
  return {
    id: String(comment._id || comment.id),
    text: comment.text,
    createdAt: comment.createdAt,
    author: author ? { id: String(author._id || author.id), name: author.name } : { name: 'Member' }
  };
}

function canSeePost(post, userId) {
  return post.isPublic !== false || idEq(post.authorId?._id || post.authorId, userId);
}

class JsonStore {
  constructor() { this.storageName = 'json'; }

  async ensureSeed(seedFn) {
    if (readJson().posts.length === 0) await seedFn(this);
  }

  async createUser({ name, email, passwordHash }) {
    const data = readJson();
    const normalizedEmail = email.trim().toLowerCase();
    if (data.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }
    const user = {
      id: crypto.randomUUID(), name, email: normalizedEmail, passwordHash,
      following: [], createdAt: new Date().toISOString()
    };
    data.users.push(user);
    writeJson(data);
    return publicUser(user);
  }

  async findUserByEmail(email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    return readJson().users.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
  }

  async findUserById(id) {
    return readJson().users.find((u) => idEq(u.id, id)) || null;
  }

  async deleteAccount(userId) {
    const data = readJson();
    if (!data.users.some((user) => idEq(user.id, userId))) return false;
    const deletedPostIds = new Set(data.posts.filter((post) => idEq(post.authorId, userId)).map((post) => String(post.id)));
    data.posts = data.posts.filter((post) => !idEq(post.authorId, userId));
    data.comments = data.comments.filter((comment) =>
      !idEq(comment.authorId, userId) && !deletedPostIds.has(String(comment.postId))
    );
    for (const post of data.posts) post.likes = (post.likes || []).filter((id) => !idEq(id, userId));
    for (const user of data.users) user.following = (user.following || []).filter((id) => !idEq(id, userId));
    data.users = data.users.filter((user) => !idEq(user.id, userId));
    writeJson(data);
    return true;
  }

  async listPosts({ tag, includePrivateFor } = {}) {
    const data = readJson();
    const viewer = data.users.find((u) => idEq(u.id, includePrivateFor));
    let posts = data.posts.filter((post) => canSeePost(post, includePrivateFor));
    if (tag && tag !== 'All') {
      const normalizedTag = tag.toLowerCase();
      posts = posts.filter((post) => (post.tags || []).some((value) => value.toLowerCase() === normalizedTag));
    }
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return posts.map((post) => {
      const author = data.users.find((u) => idEq(u.id, post.authorId));
      const commentCount = data.comments.filter((comment) => idEq(comment.postId, post.id)).length;
      const liked = Boolean(viewer && (post.likes || []).some((id) => idEq(id, viewer.id)));
      const isFollowingAuthor = Boolean(viewer && (viewer.following || []).some((id) => idEq(id, post.authorId)));
      return publicPost(post, author, commentCount, liked, isFollowingAuthor);
    });
  }

  async getPostBySlug(slug, userId) {
    const data = readJson();
    const post = data.posts.find((item) => item.slug === slug);
    if (!post || !canSeePost(post, userId)) return null;
    const author = data.users.find((u) => idEq(u.id, post.authorId));
    const viewer = data.users.find((u) => idEq(u.id, userId));
    const commentCount = data.comments.filter((comment) => idEq(comment.postId, post.id)).length;
    const liked = Boolean(viewer && (post.likes || []).some((id) => idEq(id, userId)));
    const following = Boolean(viewer && (viewer.following || []).some((id) => idEq(id, post.authorId)));
    return publicPost(post, author, commentCount, liked, following);
  }

  async createPost(post) {
    const data = readJson();
    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(), ...post, likes: [],
      createdAt: now, updatedAt: now
    };
    data.posts.unshift(record);
    writeJson(data);
    const author = data.users.find((u) => idEq(u.id, record.authorId));
    return publicPost(record, author);
  }

  async updatePost(postId, authorId, changes) {
    const data = readJson();
    const post = data.posts.find((item) => idEq(item.id, postId) && idEq(item.authorId, authorId));
    if (!post) return null;
    Object.assign(post, changes, { updatedAt: new Date().toISOString() });
    writeJson(data);
    const author = data.users.find((user) => idEq(user.id, post.authorId));
    const commentCount = data.comments.filter((comment) => idEq(comment.postId, post.id)).length;
    return publicPost(post, author, commentCount);
  }

  async deletePost(postId, authorId) {
    const data = readJson();
    const index = data.posts.findIndex((item) => idEq(item.id, postId) && idEq(item.authorId, authorId));
    if (index < 0) return false;
    const [post] = data.posts.splice(index, 1);
    data.comments = data.comments.filter((comment) => !idEq(comment.postId, post.id));
    writeJson(data);
    return true;
  }

  async slugExists(slug, exceptId) {
    return readJson().posts.some((post) => post.slug === slug && !idEq(post.id, exceptId));
  }

  async toggleLike(postId, userId) {
    const data = readJson();
    const post = data.posts.find((item) => idEq(item.id, postId));
    if (!post || !canSeePost(post, userId)) return null;
    post.likes ||= [];
    const index = post.likes.findIndex((id) => idEq(id, userId));
    if (index >= 0) post.likes.splice(index, 1);
    else post.likes.push(userId);
    writeJson(data);
    return { likeCount: post.likes.length, liked: index < 0 };
  }

  async toggleFollow(userId, targetId) {
    if (idEq(userId, targetId)) return { error: 'You cannot follow your own account' };
    const data = readJson();
    const user = data.users.find((item) => idEq(item.id, userId));
    const target = data.users.find((item) => idEq(item.id, targetId));
    if (!user || !target) return null;
    user.following ||= [];
    const index = user.following.findIndex((id) => idEq(id, targetId));
    if (index >= 0) user.following.splice(index, 1);
    else user.following.push(targetId);
    writeJson(data);
    return { following: index < 0 };
  }

  async listComments(postId) {
    const data = readJson();
    return data.comments
      .filter((comment) => idEq(comment.postId, postId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((comment) => publicComment(comment, data.users.find((u) => idEq(u.id, comment.authorId))));
  }

  async addComment({ postId, authorId, text }) {
    const data = readJson();
    const post = data.posts.find((item) => idEq(item.id, postId));
    if (!post || !canSeePost(post, authorId)) return null;
    const author = data.users.find((user) => idEq(user.id, authorId));
    if (!author) return null;
    const comment = {
      id: crypto.randomUUID(), postId, authorId, text,
      createdAt: new Date().toISOString()
    };
    data.comments.push(comment);
    writeJson(data);
    return publicComment(comment, author);
  }
}

class MongoStore {
  constructor() { this.storageName = 'mongodb'; }

  async ensureSeed(seedFn) {
    if (await Post.countDocuments() === 0) await seedFn(this);
  }

  async createUser({ name, email, passwordHash }) {
    try {
      const user = await User.create({ name, email: email.trim().toLowerCase(), passwordHash });
      return publicUser(user);
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error('Email already registered');
        error.status = 409;
        throw error;
      }
      throw err;
    }
  }

  async findUserByEmail(email) {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return null;
    return { id: String(user._id), name: user.name, email: user.email, passwordHash: user.passwordHash };
  }

  async findUserById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await User.findById(id);
    return user ? { id: String(user._id), name: user.name, email: user.email } : null;
  }

  async deleteAccount(userId) {
    if (!mongoose.isValidObjectId(userId)) return false;
    const ownedPosts = await Post.find({ authorId: userId }).select('_id');
    const ownedPostIds = ownedPosts.map((post) => post._id);
    const commentFilter = [{ authorId: userId }];
    if (ownedPostIds.length) commentFilter.push({ postId: { $in: ownedPostIds } });
    await Comment.deleteMany({ $or: commentFilter });
    await Post.deleteMany({ authorId: userId });
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
    await User.updateMany({ following: userId }, { $pull: { following: userId } });
    return Boolean(await User.findByIdAndDelete(userId));
  }

  async listPosts({ tag, includePrivateFor } = {}) {
    const query = includePrivateFor
      ? { $or: [{ isPublic: true }, { authorId: includePrivateFor }] }
      : { isPublic: true };
    if (tag && tag !== 'All') query.tags = new RegExp(`^${String(tag).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');
    const [posts, viewer] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).populate('authorId', 'name'),
      includePrivateFor && mongoose.isValidObjectId(includePrivateFor)
        ? User.findById(includePrivateFor).select('following')
        : null
    ]);
    if (!posts.length) return [];
    const postIds = posts.map((post) => post._id);
    const counts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const commentCounts = new Map(counts.map((item) => [String(item._id), item.count]));
    return posts.map((post) => {
      const liked = Boolean(viewer && post.likes.some((id) => idEq(id, viewer._id)));
      const isFollowingAuthor = Boolean(viewer && viewer.following.some((id) => idEq(id, post.authorId?._id)));
      return publicPost(post, post.authorId, commentCounts.get(String(post._id)) || 0, liked, isFollowingAuthor);
    });
  }

  async getPostBySlug(slug, userId) {
    const post = await Post.findOne({ slug }).populate('authorId', 'name');
    if (!post || !canSeePost(post, userId)) return null;
    const [commentCount, viewer] = await Promise.all([
      Comment.countDocuments({ postId: post._id }),
      userId && mongoose.isValidObjectId(userId) ? User.findById(userId).select('following') : null
    ]);
    const liked = Boolean(viewer && post.likes.some((id) => idEq(id, viewer._id)));
    const following = Boolean(viewer && viewer.following.some((id) => idEq(id, post.authorId?._id)));
    return publicPost(post, post.authorId, commentCount, liked, following);
  }

  async createPost(post) {
    const created = await Post.create(post);
    const populated = await created.populate('authorId', 'name');
    return publicPost(populated, populated.authorId);
  }

  async updatePost(postId, authorId, changes) {
    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(authorId)) return null;
    const post = await Post.findOneAndUpdate(
      { _id: postId, authorId },
      { $set: { ...changes, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).populate('authorId', 'name');
    if (!post) return null;
    const commentCount = await Comment.countDocuments({ postId: post._id });
    return publicPost(post, post.authorId, commentCount);
  }

  async deletePost(postId, authorId) {
    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(authorId)) return false;
    const post = await Post.findOneAndDelete({ _id: postId, authorId });
    if (!post) return false;
    await Comment.deleteMany({ postId: post._id });
    return true;
  }

  async slugExists(slug, exceptId) {
    const query = { slug };
    if (exceptId && mongoose.isValidObjectId(exceptId)) query._id = { $ne: exceptId };
    return Boolean(await Post.exists(query));
  }

  async toggleLike(postId, userId) {
    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(userId)) return null;
    const post = await Post.findById(postId);
    if (!post || !canSeePost(post, userId)) return null;
    const liked = post.likes.some((id) => idEq(id, userId));
    const updated = await Post.findByIdAndUpdate(
      postId,
      liked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true }
    );
    return updated ? { likeCount: updated.likes.length, liked: !liked } : null;
  }

  async toggleFollow(userId, targetId) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(targetId)) return null;
    if (idEq(userId, targetId)) return { error: 'You cannot follow your own account' };
    const user = await User.findById(userId).select('following');
    const targetExists = await User.exists({ _id: targetId });
    if (!user || !targetExists) return null;
    const exists = user.following.some((id) => idEq(id, targetId));
    await User.findByIdAndUpdate(userId, exists
      ? { $pull: { following: targetId } }
      : { $addToSet: { following: targetId } });
    return { following: !exists };
  }

  async listComments(postId) {
    if (!mongoose.isValidObjectId(postId)) return [];
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).populate('authorId', 'name');
    return comments.map((comment) => publicComment(comment, comment.authorId));
  }

  async addComment({ postId, authorId, text }) {
    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(authorId)) return null;
    const post = await Post.findById(postId);
    if (!post || !canSeePost(post, authorId)) return null;
    const comment = await Comment.create({ postId, authorId, text });
    const populated = await comment.populate('authorId', 'name');
    return publicComment(populated, populated.authorId);
  }
}

async function createStore() {
  if (process.env.MONGODB_URI && process.env.USE_JSON_STORE !== '1') {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');
    return new MongoStore();
  }
  console.log('Using the local JSON store. Keep it for development; hosted production requires MongoDB.');
  return new JsonStore();
}

module.exports = { createStore };
