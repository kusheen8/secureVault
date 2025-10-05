const { connect } = require('../lib/mongoose');
const User = require('../models/User');

async function main() {
  try {
    await connect();
    const users = await User.find().limit(20).lean();
    console.log('found', users.length, 'users')
    console.dir(users, { depth: null })
  } catch (e) {
    console.error('error', e.message)
    process.exit(1)
  }
}

main()
