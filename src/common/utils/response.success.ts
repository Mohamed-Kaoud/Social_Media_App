import { Response } from "express";

type resParamsTypes = {
  res: Response;
  status?: number;
  message?: string;
  data?: any | undefined;
};
export const successResponse = ({
  res,
  status = 200,
  message = "Done ✅",
  data = undefined,
}: resParamsTypes) => {
  return res.status(status).json({ message, data });
};
