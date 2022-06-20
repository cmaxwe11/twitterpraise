import {
  AllEventLogsQueryParameters,
  useAllEventLogs,
} from '@/model/eventlogs';
import EventLog from '@/components/eventlog/EventLog';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dispatch, SetStateAction } from 'react';
import { classNames } from '@/utils/index';

interface EventLogsTableProps {
  queryParameters: AllEventLogsQueryParameters;
  setPage: Dispatch<SetStateAction<number>>;
}

const EventLogsTable = ({
  queryParameters,
  setPage,
}: EventLogsTableProps): JSX.Element | null => {
  const { logsData } = useAllEventLogs(queryParameters);

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        {logsData.docs.map((eventlog, i) => (
          <EventLog
            eventlog={eventlog}
            className={classNames(
              i % 2 === 0 ? 'bg-warm-gray-100 dark:bg-slate-500' : undefined,
              'px-5'
            )}
            key={i}
          />
        ))}
      </div>
      {(logsData.hasNextPage || logsData.hasPrevPage) && (
        <div className="flex justify-between w-full mt-4 mb-5 space-x-4">
          <div>
            {logsData.hasPrevPage && (
              <a
                className="cursor-pointer"
                onClick={(): void => setPage(queryParameters.page - 1)}
              >
                <FontAwesomeIcon
                  icon={faArrowLeft}
                  size="1x"
                  className="pl-5 mr-2"
                />
                Previous
              </a>
            )}
          </div>

          <div>
            {logsData.hasNextPage && (
              <a
                className="cursor-pointer"
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                onClick={(): void => setPage(queryParameters.page + 1)}
              >
                Next
                <FontAwesomeIcon
                  icon={faArrowRight}
                  size="1x"
                  className="pr-5 ml-2"
                />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLogsTable;
