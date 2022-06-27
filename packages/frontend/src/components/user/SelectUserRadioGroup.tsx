import { classNames } from '@/utils/index';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RadioGroup } from '@headlessui/react';
import { UserDto } from 'api/dist/user/types';
import { UserAvatarAndName } from './UserAvatarAndName';

interface Props {
  users?: UserDto[];
  value?: string;
  onSelect(userId: string): void;
}

const SelectUserRadioGroup = ({
  users = [],
  value = undefined,
  onSelect,
}: Props): JSX.Element => {
  return (
    <RadioGroup value={value} onChange={onSelect} className="w-full">
      <div className="space-y-2 p-4 max-h-64 overflow-y-auto dark:bg-slate-600 dark:text-white">
        {users.map((user) => (
          <RadioGroup.Option
            value={user._id}
            key={user._id}
            className={({ checked }): string =>
              classNames(
                checked
                  ? 'text-white bg-warm-gray-500 hover:bg-warm-gray-500 dark:bg-slate-800 dark:hover:bg-slate-800'
                  : '',
                'relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md hover:bg-warm-gray-100 dark:hover:bg-slate-700 bg-warm-gray-100 dark:bg-slate-500'
              )
            }
          >
            {({ checked }): JSX.Element => (
              <div className="w-full flex items-center justify-between">
                <div className="text-lg mx-4 pr-8">
                  <UserAvatarAndName user={user} />
                </div>
                <div className="shrink-0 w-8 text-white">
                  {checked && (
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                  )}
                </div>
              </div>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
};

export default SelectUserRadioGroup;
