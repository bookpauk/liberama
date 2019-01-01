import axios from 'axios';

async function test() {
  try {
    const response = await axios.post('/api/config', {params: ['version']});
    console.log(response);
  } catch (error) {
    console.error(error.response.data);
  }
}
test();

