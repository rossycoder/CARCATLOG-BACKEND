const mongoose = require('mongoose');

const newsPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true,
    default: 'Admin'
  },
  category: {
    type: String,
    enum: ['news', 'review', 'guide', 'electric', 'leasing'],
    default: 'news'
  },
  tags: [{
    type: String,
    trim: true
  }],
  published: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
newsPostSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
newsPostSchema.index({ slug: 1 });
newsPostSchema.index({ published: 1, publishedAt: -1 });
newsPostSchema.index({ featured: -1 });
newsPostSchema.index({ category: 1 });

module.exports = mongoose.model('NewsPost', newsPostSchema);
