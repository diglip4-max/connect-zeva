import axios from "axios";
import { ENV } from "src/config/env";
import logger from "src/utils/logger";

export const getPermissionsFromZeva = async ({
  module,
  subModule,
  userId,
}: {
  module: string;
  subModule: string;
  userId: string;
}) => {
  try {
    const response = await axios.get(
      `${ENV.ZEVA_AUTH_INTERNAL_URL}/permissions`,
      {
        params: {
          module,
          subModule,
          userId,
        },
        headers: {
          "x-internal-api-key": ENV.ZEVA_INTERNAL_API_KEY,
        },
      },
    );
    return response.data;
  } catch (err) {
    logger.error({ err }, "Error fetching permissions from Zeva");
    throw err;
  }
};
