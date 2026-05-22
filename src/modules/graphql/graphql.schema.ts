import {
  GraphQLObjectType,
  GraphQLSchema,
} from "graphql";
import userFields from "../auth/graphql/user.fields";




export const gql_schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "root_Query",
    description: "Get Users",
    fields: {
       ...userFields.query()
    },
  }),
  // mutation: new GraphQLObjectType({
  //   name: "Add_User",
  //   fields: {
  //   //  ...userFields.mutation()
  //   },
  // }),
});
