import LoaderSpinner from "@/components/LoaderSpinner";
import { AllPraiseList, Praise } from "@/model/praise";
import { formatDate } from "@/utils/date";
import { faSadTear, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { SyntheticEvent } from "react";
import { useHistory } from "react-router-dom";
import { TableOptions, useTable } from "react-table";
import { useRecoilValue } from "recoil";
import MyPraisePageLoader from "./MyPraisePageLoader";

export const MY_PRAISE_LIST_KEY = "MY_PRAISE";

const MyPraiseTable = () => {
  const history = useHistory();
  const allPraise = useRecoilValue(AllPraiseList(MY_PRAISE_LIST_KEY));
  const columns = React.useMemo(
    () => [
      {
        accessor: "createdAt",
        Cell: (data: any) => (
          <div className="flex items-center w-full overflow-hidden">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUserCircle} size="2x" />
            </div>
            <div className="flex-grow p-3 whitespace-nowrap">
              {formatDate(data.row.original.createdAt)}
              <br />
              From: {data.row.original.giver.username}
              <br />
              To: {data.row.original.receiver.username}
            </div>
          </div>
        ),
      },
      {
        accessor: "reason",
        Cell: (data: any) => (
          <div className="w-full overflow-hidden">{data.value}</div>
        ),
      },
    ],
    []
  );

  const options = {
    columns,
    data: allPraise ? allPraise : [],
  } as TableOptions<{}>;
  const tableInstance = useTable(options);

  const { getTableProps, getTableBodyProps, rows, prepareRow } = tableInstance;

  const handleClick = (data: Praise) => (e: SyntheticEvent) => {
    history.push(`/praise/${data._id}`);
  };

  return (
    <>
      {" "}
      {allPraise ? (
        <table
          id="praises-table"
          className="w-full text-xs table-fixed"
          {...getTableProps()}
        >
          <tbody {...getTableBodyProps()}>
            <tr>
              <td className="w-72"></td>
              <td></td>
            </tr>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr
                  className="cursor-pointer hover:bg-gray-100"
                  id={"praise-" + row.values.id}
                  {...row.getRowProps()}
                  onClick={handleClick(row.original as Praise)}
                >
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div>
          {" "}
          <FontAwesomeIcon icon={faSadTear} size="2x" className="mr-2" />
          <div className="mt-3">You have not yet received any praise.</div>
        </div>
      )}
      <React.Suspense fallback={<LoaderSpinner />}>
        <MyPraisePageLoader />
      </React.Suspense>
    </>
  );
};

export default MyPraiseTable;
