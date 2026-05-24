export const successResponse = <T>(data: T, status = 200) =>
  Response.json(
    {
      success: true,
      data,
      error: null,
    },
    { status },
  );

export const errorResponse = (message: string, status = 500) =>
  Response.json(
    {
      success: false,
      data: null,
      error: message,
    },
    { status },
  );
