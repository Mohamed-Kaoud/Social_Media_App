import { EmailEnum } from "../../common/enum/email.enum";
import { redisClient } from "./redis.connect";

export const otp_key = ({email, subject = EmailEnum.confirmEmail}: {email: string, subject?: string}) => {
    return `otp::${email}::${subject}`
}

export const block_otp_key = (email: string) => {
    return `${otp_key({email})}::blocked`
}

export const max_otp_key = (email: string) => {
    return `${otp_key({email})}::max_tries`
}

export const revoked_key = ({userId, jti}: {userId: any, jti: any}) => {
    return `revoke_token::${userId}::${jti}`
}

export const get_key = (userId: any) => {
    return `revoke_token::${userId}`
}

export const setValue = async ({
  key,
  value,
  ttl,
}: {
  key: string;
  value: unknown;
  ttl?: number;
}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log(`Fail to set value in redis ❌`, error);
  }
};

export const get = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  } catch (error) {
    console.log(`Fail to get data from redis`, error);
  }
};

export const update = async ({
  key,
  value,
  ttl,
}: {
  key: string;
  value: unknown;
  ttl?: number;
}) => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    return ttl !== undefined
      ? await setValue({ key, value, ttl })
      : await setValue({ key, value });
  } catch (error) {
    console.log(`Fail to update data in redis`, error);
  }
};

export const deleteKey = async (key: string) => {
  try {
    if (!key.length) {
      return 0;
    }
    return await redisClient.del(key);
  } catch (error) {
    console.log(`Fail to delete key from redis`, error);
  }
};

export const exists = async (key: string) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log(`Fail to check existance of ${key} in redis ❌`, error);
  }
};

export const ttl = async (key: string) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log(`Fail to check ttl of ${key} in redis`, error);
  }
};

export const expire = async ({ key, ttl }: { key: string; ttl: number }) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log(`Fail to add expiration to ${key} in redis`, error);
  }
};

export const keys = async (pattern: string) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log(`Fail to get all keys for the pattern: ${pattern}`, error);
  }
};

export const incr = async (key: string) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log(`Fail to incr this key`, error);
  }
};
