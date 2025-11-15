export const handler = async (event) => {
  let result = 'This is the test lambda'
  
  const response = {
    statusCode: 200,
    body: JSON.stringify(result),
  }
  
  return response
}
