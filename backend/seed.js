const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

async function seed(store) {
  let team = await store.findUserByEmail('team@datasphare.local');
  if (!team) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 12);
    team = await store.createUser({
      name: 'DataSphare Team',
      email: 'team@datasphare.local',
      passwordHash
    });
  }

  const posts = [
    {
      title: 'Getting Started with Linear Regression: A Complete Guide',
      excerpt: 'Learn the fundamentals of linear regression through interactive examples and real-world applications.',
      tags: ['Machine Learning', 'Tutorial'],
      authorId: team.id,
      content: `<p>Linear regression is one of the fundamental algorithms in machine learning. In this guide we walk from intuition to the update rule you will see in the hands-on demo.</p>
<h2>What is Linear Regression?</h2>
<p>Linear regression is a supervised learning algorithm used for predicting a continuous target from one or more input features. It assumes a linear relationship between inputs and output.</p>
<h2>The Mathematics Behind It</h2>
<p>The model is:</p>
<div class="equation-box"><code>y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ + ε</code></div>
<p>Where y is the target, x are features, β are coefficients, and ε is residual error.</p>
<h2>How It Works</h2>
<p>Training finds the best-fitting line by minimizing squared error — ordinary least squares, or gradient descent when you want to watch weights move live.</p>
<h2>Try it</h2>
<p>Open the interactive <a href="/linear-regression.html">Linear Regression lesson</a> to build a dataset, split it, and train with gradient descent.</p>`
    },
    {
      title: 'Understanding Gradient Descent: Visual Guide',
      excerpt: 'A visual walkthrough of how gradient descent optimizes machine learning models.',
      tags: ['Machine Learning'],
      authorId: team.id,
      content: `<p>Gradient descent is the workhorse behind most of the models you will train on DataSphare.</p>
<h2>The idea</h2>
<p>You start with a guess for the weights, measure error, then take a small step in the direction that reduces that error.</p>
<h2>Learning rate</h2>
<p>Too large a step and the loss bounces. Too small and training crawls. The Linear Regression demo lets you watch both cases.</p>`
    },
    {
      title: 'Statistics for Data Science: Probability Basics',
      excerpt: 'Master the probability ideas every data scientist uses when reading model output.',
      tags: ['Statistics', 'Tutorial'],
      authorId: team.id,
      content: `<p>Machine learning sits on probability. Before you dive into logistic regression, get comfortable with events, independence, and expected value.</p>
<h2>Why it matters</h2>
<p>A classifier does not output “truth” — it outputs a score you interpret as uncertainty. Probability is the language of that uncertainty.</p>
<p>The Statistics section of DataSphare is next on the roadmap.</p>`
    }
  ];

  for (const p of posts) {
    let slug = slugify(p.title);
    let n = 1;
    while (await store.slugExists(slug)) {
      slug = `${slugify(p.title)}-${n++}`;
    }
    await store.createPost({
      slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      tags: p.tags,
      isPublic: true,
      authorId: p.authorId
    });
  }

  console.log('Seeded DataSphare sample stories. The sample author account cannot sign in.');
}

module.exports = { seed, slugify };
