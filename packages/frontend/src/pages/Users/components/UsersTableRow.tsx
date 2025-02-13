import { useHistory } from 'react-router-dom';
import { InlineLabel } from '@/components/ui/InlineLabel';
import { UserAvatarAndName } from '@/components/user/UserAvatarAndName';
import { UserRole } from '@/model/user/enums/user-role.enum';
import { User } from '@/model/user/dto/user.dto';

interface IUsersTableRow {
  data: User;
}

export const UsersTableRow = ({ data }: IUsersTableRow): JSX.Element | null => {
  const history = useHistory();

  return (
    <div
      className="flex items-center w-full px-5 py-3 cursor-pointer hover:bg-warm-gray-100 dark:hover:bg-slate-500"
      onClickCapture={(): void => history.push(`users/${data._id}`)}
    >
      <div className="flex items-center w-full ">
        <div className="flex items-center w-1/2 pr-3">
          <UserAvatarAndName user={data} avatarClassName="text-2xl" />
        </div>
        <div className="w-1/2 text-right">
          {data.roles.map((role, index) => {
            if (role !== UserRole.USER) {
              return (
                <InlineLabel
                  key={`${role}-${index}`}
                  text={role}
                  className="bg-themecolor-alt-1"
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};
