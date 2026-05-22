import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export let GenderType = new GraphQLEnumType({
  name: "GenderEnum",
  values: {
    male: { value: "male" },
    female: { value: "female" },
  },
});

export let userType = new GraphQLObjectType({
  name: "Users",
  fields: {
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    age: { type: GraphQLInt },
    gender: { type: GenderType },
    phone: { type: GraphQLString },
    profilePic: { type: GraphQLString },
  },
});
