import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";

class BaseRepository<Tdocument> {
  constructor(protected readonly model: Model<Tdocument>) {}

  async create(data: Partial<Tdocument>): Promise<HydratedDocument<Tdocument>> {
    return this.model.create(data);
  }

  async findOne({
    filter,
    projection,
  }: {
    filter: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOne(filter, projection);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findById(id);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument>[] | []> {
    return this.model.find(filter,projection)
    .skip(options?.skip!)
    .limit(options?.limit!)
    .sort(options?.sort)
    .populate(options?.populate as PopulateOptions)
  }
    findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
  }

  findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndDelete(filter, options);
  }
}

export default BaseRepository
