const axios = require('axios');
axios.post('http://localhost:3001/api/v1/auth/login', {
  email: 'admin@sltmobitel.lk',
  password: 'admin123'
}).then(res => console.log(res.data))
  .catch(err => console.error(err.response.data));
