export const handler = async (event) => {
  let result = 'This is the test lambda'
  
  const response = {
    body: JSON.stringify(result),
  }
  
  return response
}
