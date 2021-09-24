export const handler = async (event: any): Promise<any> => {
  console.log(event);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: `<p>Hello there!!</p>`,
  }
}
