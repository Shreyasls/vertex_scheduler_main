/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
// import { PaginationView } from '../../utils/paginationView';
import TableData from '../../utils/tableData';
import { ICellProps, handleDebounce } from '../../utils/utils';
import { Dayjs } from 'dayjs';
import { LabIcon } from '@jupyterlab/ui-components';
import downloadIcon from '../../../style/icons/scheduler_download.svg';
import { CircularProgress } from '@mui/material';
import { SchedulerService } from '../schedulerServices';
import { VertexServices } from './VertexServices';

const iconDownload = new LabIcon({
    name: 'launcher:download-icon',
    svgstr: downloadIcon
});

interface IDagRunList {
    dagRunId: string;
    // filteredDate: Date;
    startDate: string;
    endDate: string;
    gcsUrl: string;
    state: string;
    date: Date;
    time: string;
}

// const schedulerLists = {
//     "notebookExecutionJobs": [
//         {
//             "name": "projects/411524708443/locations/us-central1/notebookExecutionJobs/4764804007711473664",
//             "displayName": "test19",
//             "gcsNotebookSource": {
//                 "uri": "gs://vertex-schedules/test19/vertex.ipynb"
//             },
//             "scheduleResourceName": "projects/411524708443/locations/us-central1/schedules/3912928786789695488",
//             "gcsOutputUri": "gs://bq-table-shub",
//             "jobState": "JOB_STATE_SUCCEEDED",
//             "createTime": "2024-12-12T18:05:01.674901Z",
//             "updateTime": "2024-12-12T18:08:46.961478Z",
//             "serviceAccount": "411524708443-compute@developer.gserviceaccount.com",
//             "kernelName": "python3"
//         },
//         {
//             "name": "projects/411524708443/locations/us-central1/notebookExecutionJobs/2112183827190251520",
//             "displayName": "test19",
//             "gcsNotebookSource": {
//                 "uri": "gs://vertex-schedules/test19/vertex.ipynb"
//             },
//             "scheduleResourceName": "projects/411524708443/locations/us-central1/schedules/3912928786789695488",
//             "gcsOutputUri": "gs://bq-table-shub",
//             "jobState": "JOB_STATE_SUCCEEDED",
//             "createTime": "2024-12-12T18:04:00.899723Z",
//             "updateTime": "2024-12-12T18:07:56.114234Z",
//             "serviceAccount": "411524708443-compute@developer.gserviceaccount.com",
//             "kernelName": "python3"
//         },
//         {
//             "name": "projects/411524708443/locations/us-central1/notebookExecutionJobs/1873493046939615232",
//             "displayName": "test19",
//             "gcsNotebookSource": {
//                 "uri": "gs://vertex-schedules/test19/vertex.ipynb"
//             },
//             "scheduleResourceName": "projects/411524708443/locations/us-central1/schedules/3912928786789695488",
//             "gcsOutputUri": "gs://bq-table-shub",
//             "jobState": "JOB_STATE_SUCCEEDED",
//             "createTime": "2024-12-12T18:03:00.899506Z",
//             "updateTime": "2024-12-12T18:06:45.679086Z",
//             "serviceAccount": "411524708443-compute@developer.gserviceaccount.com",
//             "kernelName": "python3"
//         },
//         {
//             "name": "projects/411524708443/locations/us-central1/notebookExecutionJobs/8944144461911293952",
//             "displayName": "test19",
//             "gcsNotebookSource": {
//                 "uri": "gs://vertex-schedules/test19/vertex.ipynb"
//             },
//             "scheduleResourceName": "projects/411524708443/locations/us-central1/schedules/3912928786789695488",
//             "gcsOutputUri": "gs://bq-table-shub",
//             "jobState": "JOB_STATE_SUCCEEDED",
//             "createTime": "2024-12-12T18:02:00.941160Z",
//             "updateTime": "2024-12-12T18:06:06.321532Z",
//             "serviceAccount": "411524708443-compute@developer.gserviceaccount.com",
//             "kernelName": "python3"
//         },
//     ]
// }

// interface ISchedulerList {
//     name: string
//     displayName: string
//     gcsNotebookSource: GcsNotebookSource
//     scheduleResourceName: string
//     gcsOutputUri: string
//     jobState: string
//     createTime: string
//     updateTime: string
//     serviceAccount: string
//     kernelName: string
// }

// interface GcsNotebookSource {
//     uri: string
// }

const VertexJobRuns = ({
    region,
    schedulerData,
    dagId,
    // startDate,
    // endDate,
    setDagRunId,
    selectedMonth,
    selectedDate,
    setBlueListDates,
    setGreyListDates,
    setOrangeListDates,
    setRedListDates,
    setGreenListDates,
    setDarkGreenListDates,
    bucketName,
    setIsLoading,
    isLoading
}: {
    region: string;
    schedulerData: string;
    dagId: string;
    // startDate: string;
    // endDate: string;
    setDagRunId: (value: string) => void;
    selectedMonth: Dayjs | null;
    selectedDate: Dayjs | null;
    setBlueListDates: (value: string[]) => void;
    setGreyListDates: (value: string[]) => void;
    setOrangeListDates: (value: string[]) => void;
    setRedListDates: (value: string[]) => void;
    setGreenListDates: (value: string[]) => void;
    setDarkGreenListDates: (value: string[]) => void;
    bucketName: string;
    setIsLoading: (value: boolean) => void;
    isLoading: boolean;
}): JSX.Element => {
    const [dagRunsList, setDagRunsList] = useState<IDagRunList[]>([]);
    // const [dagRunsCurrentDateList, setDagRunsCurrentDateList] = useState([]);
    const [downloadOutputDagRunId, setDownloadOutputDagRunId] = useState('');
    const [listDagRunHeight, setListDagRunHeight] = useState(
        window.innerHeight - 485
    );
    // const [initialLoad, setInitialLoad] = useState(true);

    function handleUpdateHeight() {
        let updateHeight = window.innerHeight - 485;
        setListDagRunHeight(updateHeight);
    }

    // Debounce the handleUpdateHeight function
    const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

    // Add event listener for window resize using useEffect
    useEffect(() => {
        window.addEventListener('resize', debouncedHandleUpdateHeight);

        // Cleanup function to remove event listener on component unmount
        return () => {
            window.removeEventListener('resize', debouncedHandleUpdateHeight);
        };
    }, []);

    // const data = dagRunsCurrentDateList.length > 0 ? dagRunsCurrentDateList : dagRunsList;
    // const data = dagRunsList;
    const filteredData = React.useMemo(() => {
        if (selectedDate) {
            const selectedDateString = selectedDate.toDate().toDateString(); // Only date, ignoring time
            return dagRunsList.filter((dagRun) => {
                return new Date(dagRun.date).toDateString() === selectedDateString;
            });
        }
        return dagRunsList; // If no date is selected, return all data
    }, [dagRunsList, selectedDate]);
    // console.log(filteredData)

    const columns = React.useMemo(
        () => [
            {
                Header: 'State',
                accessor: 'state'
            },
            {
                Header: 'Date',
                accessor: 'date'
            },
            {
                Header: 'Time',
                accessor: 'time'
            },
            {
                Header: 'Actions',
                accessor: 'actions'
            }
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        page,
        // canPreviousPage,
        // canNextPage,
        // nextPage,
        // previousPage,
        // setPageSize,
        // gotoPage,
        // state: { pageIndex, pageSize }
    } = useTable(
        //@ts-ignore react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
        { columns, data: filteredData, autoResetPage: false, initialState: { pageSize: filteredData.length } },
        // { columns, data, autoResetPage: false },
        useGlobalFilter,
        // usePagination
    );

    const tableDataCondition = (cell: ICellProps) => {
        if (cell.column.Header === 'Actions') {
            return (
                <td {...cell.getCellProps()} className="clusters-table-data">
                    {renderActions(cell.row.original)}
                </td>
            );
        } else if (cell.column.Header === 'State') {
            if (cell.value === 'succeeded') {
                return (
                    <div className="dag-run-state-parent">
                        <td
                            {...cell.getCellProps()}
                            className="dag-runs-table-data-state-success"
                            onClick={() => handleDagRunStateClick(cell.row.original)}
                        >
                            {cell.render('Cell')}
                        </td>
                    </div>
                );
            } else if (cell.value === 'failed') {
                return (
                    <div className="dag-run-state-parent">
                        <td
                            {...cell.getCellProps()}
                            className="dag-runs-table-data-state-failure"
                            onClick={() => handleDagRunStateClick(cell.row.original)}
                        >
                            {cell.render('Cell')}
                        </td>
                    </div>
                );
            } else if (cell.value === 'running') {
                return (
                    <div className="dag-run-state-parent">
                        <td
                            {...cell.getCellProps()}
                            className="dag-runs-table-data-state-running"
                            onClick={() => handleDagRunStateClick(cell.row.original)}
                        >
                            {cell.render('Cell')}
                        </td>
                    </div>
                );
            } else if (cell.value === 'queued') {
                return (
                    <div className="dag-run-state-parent">
                        <td
                            {...cell.getCellProps()}
                            className="dag-runs-table-data-state-queued"
                            onClick={() => handleDagRunStateClick(cell.row.original)}
                        >
                            {cell.render('Cell')}
                        </td>
                    </div>
                );
            }
        }
        return (
            <td {...cell.getCellProps()} className="notebook-template-table-data">
                {cell.render('Cell')}
            </td>
        );
    };

    const handleDagRunStateClick = (data: any) => {
        setDagRunId(data.dagRunId);
    };

    const handleDownloadOutput = async (event: React.MouseEvent) => {
        const dagRunId = event.currentTarget.getAttribute('data-dag-run-id')!;
        await SchedulerService.handleDownloadOutputNotebookAPIService(
            schedulerData,
            dagRunId,
            bucketName,
            dagId,
            setDownloadOutputDagRunId
        );
    };

    const renderActions = (data: any) => {
        return (
            <div className="actions-icon">
                {data.dagRunId === downloadOutputDagRunId ? (
                    <div className="icon-buttons-style">
                        <CircularProgress
                            size={18}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    </div>
                ) : (
                    <div
                        role="button"
                        className={
                            data.state === 'succeeded'
                                ? 'icon-buttons-style'
                                : 'icon-buttons-style-disable'
                        }
                        title="Download Output"
                        data-dag-run-id={data.dagRunId}
                        onClick={
                            data.state === 'succeeded'
                                ? e => handleDownloadOutput(e)
                                : undefined
                        }
                    >
                        <iconDownload.react
                            tag="div"
                            className="icon-white logo-alignment-style"
                        />
                    </div>
                )}
            </div>
        );
    };

    const scheduleRunsList = async () => {
        await VertexServices.executionHistoryServiceList(
            region,
            schedulerData,
            selectedMonth,
            setIsLoading,
            setDagRunsList,
            setBlueListDates,
            setGreyListDates,
            setOrangeListDates,
            setRedListDates,
            setGreenListDates,
            setDarkGreenListDates,
        );
    };

    useEffect(() => {
        if (selectedMonth !== null) {
            scheduleRunsList();
        }
    }, [selectedMonth]);

    // console.log(selectedMonth)
    // console.log(selectedDate)
    // const handleSelectedDateChange = () => {
    //     gotoPage(0);
    //     let currentDate = selectedDate
    //         ? new Date(selectedDate.toDate()).toDateString()
    //         : null;
    //     let currentDateDagRunList: any = dagRunsList.filter((dagRun: any) => {
    //         return dagRun.date === currentDate;
    //     });
    //     if (currentDateDagRunList.length > 0) {
    //         setDagRunsCurrentDateList(currentDateDagRunList);
    //         setDagRunId(
    //             currentDateDagRunList[currentDateDagRunList.length - 1].dagRunId
    //         );
    //     } else {
    //         setDagRunsCurrentDateList([]);
    //         setDagRunId('');
    //     }
    // };

    // useEffect(() => {
    //     handleSelectedDateChange();
    // }, [selectedDate]);

    // useEffect(() => {
    //     if (initialLoad && dagRunsList.length > 0) {
    //         handleSelectedDateChange();
    //         setInitialLoad(false);
    //     }
    // }, [dagRunsList]);

    return (
        <div>
            <>
                {(!isLoading && filteredData && filteredData.length > 0) ? (
                    <div>
                        <div
                            className="dag-runs-list-table-parent"
                            style={{ maxHeight: listDagRunHeight }}
                        >
                            <TableData
                                getTableProps={getTableProps}
                                headerGroups={headerGroups}
                                getTableBodyProps={getTableBodyProps}
                                rows={rows}
                                page={page}
                                prepareRow={prepareRow}
                                tableDataCondition={tableDataCondition}
                                fromPage="Dag Runs"
                            />
                        </div>
                        {/* {dagRunsCurrentDateList.length > 50 && (
                            <PaginationView
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                pageIndex={pageIndex}
                                allData={dagRunsCurrentDateList}
                                previousPage={previousPage}
                                nextPage={nextPage}
                                canPreviousPage={canPreviousPage}
                                canNextPage={canNextPage}
                            />
                        )} */}
                    </div>
                ) : (
                    <div>
                        {
                            isLoading &&
                            <div className="spin-loader-main">
                                <CircularProgress
                                    className="spin-loader-custom-style"
                                    size={18}
                                    aria-label="Loading Spinner"
                                    data-testid="loader"
                                />
                                Loading History
                            </div>
                        }
                        {!isLoading && filteredData.length === 0 && (
                            <div className="no-data-style">No rows to display</div>
                        )}
                    </div>
                )}
            </>
            {/* <>
                {(dagRunsList.length > 0 && selectedDate === null) ||
                    (selectedDate !== null && dagRunsCurrentDateList.length > 0) ? (
                    <div>
                        <div
                            className="dag-runs-list-table-parent"
                            style={{ maxHeight: listDagRunHeight }}
                        >
                            <TableData
                                getTableProps={getTableProps}
                                headerGroups={headerGroups}
                                getTableBodyProps={getTableBodyProps}
                                rows={rows}
                                page={page}
                                prepareRow={prepareRow}
                                tableDataCondition={tableDataCondition}
                                fromPage="Dag Runs"
                            />
                        </div>
                        {dagRunsCurrentDateList.length > 50 && (
                            <PaginationView
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                pageIndex={pageIndex}
                                allData={dagRunsCurrentDateList}
                                previousPage={previousPage}
                                nextPage={nextPage}
                                canPreviousPage={canPreviousPage}
                                canNextPage={canNextPage}
                            />
                        )}
                    </div>
                ) : (
                    <div>
                        {dagRunsCurrentDateList.length === 0 && (
                            <div className="no-data-style">No rows to display</div>
                        )}
                    </div>
                )}
            </> */}
        </div>
    );
};

export default VertexJobRuns;
