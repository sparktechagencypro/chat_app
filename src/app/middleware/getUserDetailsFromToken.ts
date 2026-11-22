import config from '@app/config/index.js';
import AppError from '@app/error/AppError.js';
import prisma from '@app/shared/prisma.js';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';

const getUserDetailsFromToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus?.UNAUTHORIZED, 'You are not authorized!');
  }

  const decode: any = jwt.verify(token, config.jwt_access_secret as string);

  const user = await prisma?.user?.findFirst({
    where: {
      id: decode?.userId,
    },
  });

  if (!user) new AppError(httpStatus?.UNAUTHORIZED, 'You are not authorized!');

  return user;
};

export default getUserDetailsFromToken;
