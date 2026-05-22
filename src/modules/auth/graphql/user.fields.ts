import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { AppError } from "../../../common/utils/global-error-handler";
import { GenderType, userType } from "./user.type";
import { addUserArgs, getUserArgs } from "./user.args";
import userService from "../../users/user.service";
import { authentication_gql } from "../../../common/middleware/authentication";
import { authorization_gql } from "../../../common/middleware/authorization";
import { RoleEnum } from "../../../common/enum/user.enum";
import { validation_gql } from "../../../common/middleware/validation";
import { getUserSchame_gql } from "../auth.validation";

class UserFields {
  constructor() {}

  query = () => {
    return {
      getUser: {
        type: userType,
        args: {token: {type: new GraphQLNonNull(GraphQLString)}},
        resolve: async(parent: any, args: any, context: any) => {
          await validation_gql(getUserSchame_gql,args)
          const {user, decoded} = await authentication_gql(args.token)
          await authorization_gql([RoleEnum.user],user.role!)
            return userService.graphQl_GetUser(user._id)
        }
      },
      getUsers: {
        type: new GraphQLList(userType),
        resolve: () => {
            return userService.graphQl_GetUsers()
        }
      },
    };
  };

  // mutation = () => {
  //   return {
  //     createUser: {
  //       type: new GraphQLList(userType),
  //       args: addUserArgs,
  //       resolve: (parent: any, args: any) => {
  //         const duplictedId = users.find((user) => {
  //           return user.id == args.id;
  //         });
  //         if (duplictedId) {
  //           throw new AppError("Id mustn't duplicate");
  //         }
  //         users.push(args);
  //         return users;
  //       },
  //     },
  //   };
  // };
}

export default new UserFields();
