import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GenderType } from "./user.type";

export const getUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLID) },
};

export const addUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLInt) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  age: { type: new GraphQLNonNull(GraphQLInt) },
  gender: { type: new GraphQLNonNull(GenderType) },
};
