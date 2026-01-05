const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Adding 10-year goals...');

const db = new Database(DB_PATH);

const goals = [
  {
    title: '$1 million net worth',
    description: 'Build wealth through smart investing, career growth, and strategic financial decisions to achieve financial independence and security.',
    category: 'Financial Freedom',
    milestones: JSON.stringify([
      'Reach $250K net worth',
      'Reach $500K net worth',
      'Reach $750K net worth',
      'Achieve $1M net worth'
    ]),
    color: '#F59E0B'
  },
  {
    title: 'Find the love of my life and make her my wife',
    description: 'Build a deep, meaningful relationship based on love, trust, and mutual growth. Find my life partner and commit to a lifetime together.',
    category: 'Relationships & Family',
    milestones: JSON.stringify([
      'Work on self-development and readiness',
      'Meet and date potential life partner',
      'Build strong relationship foundation',
      'Get engaged and married'
    ]),
    color: '#EF4444'
  },
  {
    title: 'Start a family',
    description: 'Create a loving, nurturing family environment and become a parent. Build the foundation for the next generation with love and intention.',
    category: 'Relationships & Family',
    milestones: JSON.stringify([
      'Prepare financially and emotionally',
      'Create stable home environment',
      'Welcome first child',
      'Establish family traditions and values'
    ]),
    color: '#EF4444'
  },
  {
    title: 'Have my own music studio',
    description: 'Create a professional, inspiring space for music creation. A sanctuary where creativity flows and art comes to life.',
    category: 'Career & Business',
    milestones: JSON.stringify([
      'Research and plan studio design',
      'Acquire essential equipment',
      'Set up dedicated space',
      'Complete full professional studio'
    ]),
    color: '#3B82F6'
  },
  {
    title: 'Achieve excellence in music theory and composing, become a fully fledged producer',
    description: 'Master the art and science of music. Transform from learner to expert producer, creating professional-quality work that moves people.',
    category: 'Career & Business',
    milestones: JSON.stringify([
      'Complete advanced music theory courses',
      'Produce 25+ complete tracks',
      'Develop signature sound and style',
      'Achieve professional producer status'
    ]),
    color: '#3B82F6'
  },
  {
    title: 'Heal most of my trauma, guilt, and shame, develop a safe, regulated nervous system',
    description: 'Complete deep healing work to release past pain and create lasting inner peace. Build emotional resilience and a regulated nervous system.',
    category: 'Personal Mastery',
    milestones: JSON.stringify([
      'Consistent therapy and healing work',
      'Process major trauma events',
      'Develop self-compassion practice',
      'Achieve nervous system regulation'
    ]),
    color: '#8B5CF6'
  },
  {
    title: 'Read 250 books',
    description: 'Expand knowledge, perspective, and wisdom through consistent reading. Average 25 books per year for continuous growth and learning.',
    category: 'Personal Mastery',
    milestones: JSON.stringify([
      'Read 60+ books (Years 1-2)',
      'Read 125+ books (Years 1-5)',
      'Read 190+ books (Years 1-7)',
      'Complete 250 books'
    ]),
    color: '#8B5CF6'
  },
  {
    title: 'Buy a house',
    description: 'Own a home that serves as a foundation for family life, creativity, and long-term wealth building. A place to call truly mine.',
    category: 'Financial Freedom',
    milestones: JSON.stringify([
      'Save for down payment',
      'Research locations and options',
      'Secure mortgage approval',
      'Purchase and move into home'
    ]),
    color: '#F59E0B'
  },
  {
    title: 'Establish a health project to help and inspire others - Project Better Tomorrow',
    description: 'Create a meaningful platform to share my health transformation journey and inspire others who lived similarly. Give back and create positive impact.',
    category: 'Impact & Legacy',
    milestones: JSON.stringify([
      'Define project vision and goals',
      'Create content and resources',
      'Build community platform',
      'Launch Project Better Tomorrow'
    ]),
    color: '#06B6D4'
  },
  {
    title: 'Achieve near-perfect biomarkers and slow the speed of aging',
    description: 'Optimize health at the cellular level. Maintain youthful vitality and longevity through science-based health practices.',
    category: 'Health & Fitness',
    milestones: JSON.stringify([
      'Complete comprehensive health testing',
      'Optimize nutrition and supplements',
      'Establish longevity protocols',
      'Achieve optimal biomarkers'
    ]),
    color: '#10B981'
  },
  {
    title: 'Retire from technology',
    description: 'Transition away from tech career to pursue creative passions full-time. Financial freedom to choose work based on fulfillment, not necessity.',
    category: 'Career & Business',
    milestones: JSON.stringify([
      'Build alternative income streams',
      'Achieve financial independence',
      'Transition to part-time tech work',
      'Fully retire from technology'
    ]),
    color: '#3B82F6'
  },
  {
    title: 'Go to Hawaii on a honeymoon (or babymoon 🙂)',
    description: 'Experience the beauty of Hawaii with my life partner. Create unforgettable memories in paradise during a significant life milestone.',
    category: 'Relationships & Family',
    milestones: JSON.stringify([
      'Plan and save for trip',
      'Research Hawaiian islands',
      'Book accommodations and activities',
      'Experience Hawaii together'
    ]),
    color: '#EF4444'
  },
  {
    title: 'Visit every continent',
    description: 'Experience the diversity of our world. Travel to all seven continents, embracing different cultures, landscapes, and perspectives.',
    category: 'Personal Mastery',
    milestones: JSON.stringify([
      'Visit North America, Europe, Asia',
      'Visit South America and Africa',
      'Visit Australia/Oceania',
      'Visit Antarctica - complete all 7'
    ]),
    color: '#8B5CF6'
  },
  {
    title: 'Finish one album',
    description: 'Create and complete a full-length album. A cohesive body of work that represents my artistic vision and musical journey.',
    category: 'Career & Business',
    milestones: JSON.stringify([
      'Write and compose all tracks',
      'Complete production and mixing',
      'Master and finalize album',
      'Release album to the world'
    ]),
    color: '#3B82F6'
  },
  {
    title: 'Build and develop a mental health toolbox',
    description: 'Create a comprehensive set of practices, techniques, and strategies for emotional wellbeing. Tools to navigate life\'s challenges with resilience.',
    category: 'Personal Mastery',
    milestones: JSON.stringify([
      'Learn various therapeutic techniques',
      'Develop daily practices',
      'Build coping strategies',
      'Integrate complete toolbox'
    ]),
    color: '#8B5CF6'
  }
];

try {
  const insert = db.prepare(`
    INSERT INTO decade_goals (title, description, category, milestones, isCompleted, color, sortOrder)
    VALUES (@title, @description, @category, @milestones, 0, @color, @sortOrder)
  `);

  goals.forEach((goal, index) => {
    insert.run({
      ...goal,
      sortOrder: index
    });
  });

  console.log(`✓ Successfully added ${goals.length} decade goals!`);
} catch (error) {
  console.error('Error adding goals:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('✓ Complete!');
