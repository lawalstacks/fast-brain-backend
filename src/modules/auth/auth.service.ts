import UserModel from "../../database/models/user.model";


export class UserService {
    public async findUser(googleId: string): Promise<any> {
        const user = await UserModel.findOne({googleId});
        return user;
    }

    public async createUser(user: any): Promise<any> {
        const newUser = new UserModel({
            email: user.email,
            name: user.name,
            photo: user.photo,
            googleId: user.googleId
        });
        const savedUser = await newUser.save();
        return savedUser;
    }
}