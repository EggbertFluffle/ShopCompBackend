export const handler = async (event) => {

  let result = 'default lambda function handler'
  
  const response = {
    body: JSON.stringify(result),
  }
  
  return response
}
