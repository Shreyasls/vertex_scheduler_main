/**
 * @license
 * Copyright 2025 Google LLC
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

import React, {
  useState, useEffect,
} from 'react';
import { useTable, usePagination } from 'react-table';
import TableData from '../../utils/tableData';
import { PaginationView } from '../../utils/paginationView';
import { VertexCellProps } from '../../utils/utils';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  CircularProgress,
  Button
} from '@mui/material';
import DeletePopup from '../../utils/deletePopup';
import { scheduleMode, PLUGIN_ID } from '../../utils/const';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { RegionDropdown } from '../../controls/RegionDropdown';
import { authApi } from '../../utils/utils';
import { IconActive, IconDelete, IconEditDag, IconEditNotebook, IconFailed, IconListComplete, IconListPause, IconPause, IconPlay, IconSuccess, IconTrigger } from '../../utils/icons';
import { VertexServices } from '../../Services/Vertex';
import { IDagList } from './VertexInterfaces';
import dayjs from 'dayjs';
import ErrorMessage from '../common/ErrorMessage';

function ListVertexScheduler({
  region,
  setRegion,
  app,
  setJobId,
  settingRegistry,
  handleDagIdSelection,
  setCreateCompleted,
  setInputFileSelected,
  setMachineTypeSelected,
  setAcceleratedCount,
  setAcceleratorType,
  setKernelSelected,
  setCloudStorage,
  setDiskTypeSelected,
  setDiskSize,
  setParameterDetail,
  setParameterDetailUpdated,
  setServiceAccountSelected,
  setPrimaryNetworkSelected,
  setSubNetworkSelected,
  setSubNetworkList,
  setSharedNetworkSelected,
  setScheduleMode,
  setScheduleField,
  setStartDate,
  setEndDate,
  setMaxRuns,
  setEditMode,
  setJobNameSelected,
  setGcsPath
}: {
  region: string;
  setRegion: (value: string) => void;
  app: JupyterFrontEnd;
  setJobId: (value: string) => void;
  settingRegistry: ISettingRegistry;
  handleDagIdSelection: (scheduleId: any, scheduleName: string) => void;
  setCreateCompleted: (value: boolean) => void;
  setInputFileSelected: (value: string) => void;
  setMachineTypeSelected: (value: string | null) => void;
  setAcceleratedCount: (value: string | null) => void;
  setAcceleratorType: (value: string | null) => void;
  setKernelSelected: (value: string | null) => void;
  setCloudStorage: (value: string | null) => void;
  setDiskTypeSelected: (value: string | null) => void;
  setDiskSize: (value: string) => void;
  setParameterDetail: (value: string[]) => void;
  setParameterDetailUpdated: (value: string[]) => void;
  setServiceAccountSelected: (value: { displayName: string; email: string } | null) => void;
  setPrimaryNetworkSelected: (value: { name: string; link: string } | null) => void;
  setSubNetworkSelected: (value: { name: string; link: string } | null) => void;
  setSubNetworkList: (value: { name: string; link: string }[]) => void;
  setSharedNetworkSelected: (value: { name: string; network: string, subnetwork: string } | null) => void;
  setScheduleMode: (value: scheduleMode) => void;
  setScheduleField: (value: string) => void;
  setStartDate: (value: dayjs.Dayjs | null) => void;
  setEndDate: (value: dayjs.Dayjs | null) => void;
  setMaxRuns: (value: string) => void;
  setEditMode: (value: boolean) => void;
  setJobNameSelected: (value: string) => void;
  setGcsPath: (value: string) => void;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const data = dagList;
  const [deletePopupOpen, setDeletePopupOpen] = useState<boolean>(false);
  const [editDagLoading, setEditDagLoading] = useState('');
  const [triggerLoading, setTriggerLoading] = useState('');
  const [resumeLoading, setResumeLoading] = useState('');
  const [inputNotebookFilePath, setInputNotebookFilePath] = useState<string>('');
  const [editNotebookLoading, setEditNotebookLoading] = useState<string>('');
  const [deletingSchedule, setDeletingSchedule] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('');
  const [uniqueScheduleId, setUniqueScheduleId] = useState<string>('');
  const [scheduleDisplayName, setScheduleDisplayName] = useState<string>('');
  const [isPreviewEnabled, setIsPreviewEnabled] = useState<boolean>(false);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Job Name',
        accessor: 'displayName'
      },
      {
        Header: 'Schedule',
        accessor: 'schedule'
      },
      {
        Header: 'Status',
        accessor: 'status'
      },
      {
        Header: 'Actions',
        accessor: 'actions'
      }
    ],
    []
  );

  /**
  * Get list of schedules
  */
  const listDagInfoAPI = async () => {
    setIsLoading(true);
    await VertexServices.listVertexSchedules(
      setDagList,
      region,
      setIsLoading
    );
  };

  /**
  * Handle resume and pause 
  * @param {string} scheduleId unique ID for schedule
  * @param {string} is_status_paused modfied status of schedule
  * @param {string} displayName name of schedule
  */
  const handleUpdateScheduler = async (
    scheduleId: string,
    is_status_paused: string,
    displayName: string
  ) => {
    if (is_status_paused === 'ACTIVE') {
      await VertexServices.handleUpdateSchedulerPauseAPIService(
        scheduleId,
        region,
        setDagList,
        setIsLoading,
        displayName,
        setResumeLoading
      );
    } else {
      await VertexServices.handleUpdateSchedulerResumeAPIService(
        scheduleId,
        region,
        setDagList,
        setIsLoading,
        displayName,
        setResumeLoading
      );
    }
  };

  /**
  * Trigger a job immediately
  * @param {React.ChangeEvent<HTMLInputElement>} e - event triggered by the trigger button.
  * @param {string} displayName name of schedule
  */
  const handleTriggerSchedule = async (event: React.MouseEvent, displayName: string) => {
    const scheduleId = event.currentTarget.getAttribute('data-scheduleId');
    if (scheduleId !== null) {
      await VertexServices.triggerSchedule(region, scheduleId, displayName, setTriggerLoading);
    }
  };

  /**
  * Delete pop up
  * @param {string} schedule_id Id of schedule
  * @param {string} displayName name of schedule
  */
  const handleDeletePopUp = (schedule_id: string, displayName: string) => {
    setUniqueScheduleId(schedule_id);
    setScheduleDisplayName(displayName)
    setDeletePopupOpen(true);
  };

  /**
  * Cancel delete pop up
  */
  const handleCancelDelete = () => {
    setDeletePopupOpen(false);
  };

  /** 
   * Handles the deletion of a scheduler by invoking the API service to delete it.
   */
  const handleDeleteScheduler = async () => {
    setDeletingSchedule(true);
    await VertexServices.handleDeleteSchedulerAPIService(
      region,
      uniqueScheduleId,
      scheduleDisplayName,
      setDagList,
      setIsLoading
    );
    setDeletePopupOpen(false);
    setDeletingSchedule(false);
  };

  /**
  * Handles the editing of a vertex by triggering the editVertexSchedulerService.
  * @param {React.ChangeEvent<HTMLInputElement>} event - event triggered by the edit vertex button.
  */
  const handleEditVertex = async (event: React.MouseEvent) => {
    const scheduleId = event.currentTarget.getAttribute('data-scheduleId');
    if (scheduleId !== null) {
      await VertexServices.editVertexSchedulerService(
        scheduleId,
        region,
        setInputNotebookFilePath,
        setEditNotebookLoading,
      );
    }
  };

  /**
  * Edit job
  * @param {React.ChangeEvent<HTMLInputElement>} e - event triggered by the edit job button.
  */
  const handleEditJob = async (event: React.MouseEvent, displayName: string) => {
    const job_id = event.currentTarget.getAttribute('data-jobid');
    if (job_id) {
      setJobId(job_id)
    }
    if (job_id !== null) {
      await VertexServices.editVertexSJobService(
        job_id,
        region,
        setEditDagLoading,
        setCreateCompleted,
        setInputFileSelected,
        setRegion,
        setMachineTypeSelected,
        setAcceleratedCount,
        setAcceleratorType,
        setKernelSelected,
        setCloudStorage,
        setDiskTypeSelected,
        setDiskSize,
        setParameterDetail,
        setParameterDetailUpdated,
        setServiceAccountSelected,
        setPrimaryNetworkSelected,
        setSubNetworkSelected,
        setSubNetworkList,
        setScheduleMode,
        setScheduleField,
        setStartDate,
        setEndDate,
        setMaxRuns,
        setEditMode,
        setJobNameSelected,
        setGcsPath
      );
    }
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    //@ts-ignore react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
    { columns, data, autoResetPage: false, initialState: { pageSize: 100 } },
    usePagination
  );

  const renderActions = (data: any) => {
    const is_status_paused = data.status;
    return (
      <div className="actions-icon-btn">
        {data.name === resumeLoading ? (
          <div className="icon-buttons-style">
            <CircularProgress
              size={18}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) :
          <div
            role="button"
            className="icon-buttons-style"
            title={is_status_paused === "COMPLETED" ? "Completed" : (is_status_paused === "PAUSED" ? 'Resume' : 'Pause')}
            onClick={e => {
              is_status_paused !== "COMPLETED" && handleUpdateScheduler(data.name, is_status_paused, data.displayName)
            }}
          >
            {is_status_paused === 'COMPLETED' ? <IconPlay.react
              tag="div"
              className="icon-buttons-style-disable disable-complete-btn"
            /> : (
              is_status_paused === 'PAUSED' ?
                (<IconPlay.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
                ) : (
                  <IconPause.react
                    tag="div"
                    className="icon-white logo-alignment-style"
                  />
                ))}
          </div>
        }
        {data.name === triggerLoading ? (
          <div className="icon-buttons-style">
            <CircularProgress
              size={18}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) :
          (<div
            role="button"
            className='icon-buttons-style'
            title='Trigger the job'
            data-scheduleId={data.name}
            onClick={e => handleTriggerSchedule(e, data.displayName)}
          >
            <IconTrigger.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>)
        }
        {is_status_paused === "COMPLETED" ? <IconEditNotebook.react
          tag="div"
          className="icon-buttons-style-disable"
        /> : (data.name === editDagLoading ? (
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
            className="icon-buttons-style"
            title="Edit Schedule"
            data-jobid={data.name}
            onClick={e => handleEditJob(e, data.displayName)}
          >
            <IconEditNotebook.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ))}
        {
          isPreviewEnabled && (data.name === editNotebookLoading ? (
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
              className="icon-buttons-style"
              title="Edit Notebook"
              data-scheduleId={data.name}
              onClick={e => handleEditVertex(e)}
            >
              <IconEditDag.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          ))}
        <div
          role="button"
          className="icon-buttons-style"
          title="Delete"
          onClick={() => handleDeletePopUp(data.name, data.displayName)}
        >
          <IconDelete.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
      </div>
    );
  };

  const tableDataCondition = (cell: VertexCellProps) => {
    if (cell.column.Header === 'Actions') {
      return (
        <td {...cell.getCellProps()} className="clusters-table-data">
          {renderActions(cell.row.original)}
        </td>
      );
    } else if (cell.column.Header === 'Job Name') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data"
          onClick={() => handleDagIdSelection(cell.row.original, cell.value)}
        >
          {cell.value}
        </td>
      );
    } else {
      const alignIcon = cell.row.original.status === 'ACTIVE' || cell.row.original.status === 'PAUSED' || cell.row.original.status === 'COMPLETED';

      let pauseTitle = '';

      if(cell.row.original.status === 'ACTIVE' && cell.row.original.lastScheduledRunResponse && cell.row.original.lastScheduledRunResponse.runResponse && cell.row.original.lastScheduledRunResponse.runResponse === "OK") {
        pauseTitle =  "ACTIVE";
      }

      if(cell.row.original.status === 'PAUSED' && cell.row.original.lastScheduledRunResponse && cell.row.original.lastScheduledRunResponse.runResponse && cell.row.original.lastScheduledRunResponse.runResponse === "OK") {
        pauseTitle =  "PAUSED";
      }

      return (
        <td {...cell.getCellProps()} className={cell.column.Header === 'Schedule' ? "clusters-table-data table-cell-width" : "clusters-table-data"}>
          {
            cell.column.Header === 'Status' ?
              <>
                <div className='execution-history-main-wrapper'>
                  {cell.row.original.lastScheduledRunResponse === null ? 
                    (cell.row.original.status === 'ACTIVE' ? 
                      <IconActive.react
                          tag="div"
                          title='ACTIVE'
                          className="icon-white logo-alignment-style success_icon icon-size-status"
                        />  
                        :
                        <IconListPause.react
                          tag="div"
                          title='PAUSE'
                          className="icon-white logo-alignment-style success_icon icon-size"
                        />
                      )
                  : 
                  (cell.row.original.lastScheduledRunResponse && cell.row.original.lastScheduledRunResponse.runResponse ? (cell.row.original.status === 'COMPLETED' ? (cell.row.original.lastScheduledRunResponse.runResponse === 'OK' ? <div>
                    <IconSuccess.react
                      tag="div"
                      title='Done !'
                      className="icon-white logo-alignment-style success_icon icon-size icon-completed"
                    />
                  </div> :
                    <div>
                      <IconListComplete.react
                        tag="div"
                        title={cell.row.original.lastScheduledRunResponse && cell.row.original.lastScheduledRunResponse.runResponse}
                        className="icon-white logo-alignment-style success_icon icon-size-status"
                      />
                    </div>)
                    : (cell.row.original.status === 'ACTIVE' ?
                      <IconActive.react
                        tag="div"
                        title={pauseTitle}
                        className="icon-white logo-alignment-style success_icon icon-size-status"
                      /> :
                      <IconListPause.react
                        tag="div"
                        title={pauseTitle}
                        className="icon-white logo-alignment-style success_icon icon-size"
                      />
                    ))
                    :
                    <div>
                      <IconFailed.react
                        tag="div"
                        title={!cell.row.original.lastScheduledRunResponse ? 'Not started' : cell.row.original.lastScheduledRunResponse && cell.row.original.lastScheduledRunResponse.runResponse}
                        className="icon-white logo-alignment-style success_icon icon-size"
                      />
                    </div>)}
                  <div className={alignIcon ? 'text-icon' : ''}>{cell.render('Cell')}</div>
                </div>

              </>
              :
              <>{cell.render('Cell')}</>
          }

        </td >
      );
    }
  };

  const checkPreviewEnabled = async () => {
    const settings = await settingRegistry.load(PLUGIN_ID);

    // The current value of whether or not preview features are enabled.
    let previewEnabled = settings.get('previewEnabled').composite as boolean;
    setIsPreviewEnabled(previewEnabled);
  };

   /**
  * Opens edit notebook
  */
  const openEditDagNotebookFile = async () => {
    let filePath = inputNotebookFilePath.replace('gs://', 'gs:');
    const openNotebookFile = await app.commands.execute('docmanager:open', {
      path: filePath
    });
    setInputNotebookFilePath('');
    if (openNotebookFile) {
      setEditNotebookLoading('');
    }
  };

  useEffect(() => {
    if (inputNotebookFilePath !== '') {
      openEditDagNotebookFile();
    }
  }, [inputNotebookFilePath]);

  useEffect(() => {
    checkPreviewEnabled();
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (region !== '') {
      setIsLoading(true);
      listDagInfoAPI();
    }
  }, [region]);

  useEffect(() => {
    authApi()
      .then((credentials) => {
        if (credentials && credentials?.region_id && credentials.project_id) {
          setRegion(credentials.region_id);
          setProjectId(credentials.project_id);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [projectId])


  return (
    <div>
      <div className="select-text-overlay-scheduler">
        <div className="region-overlay create-scheduler-form-element content-pd-space ">
          <RegionDropdown
            projectId={projectId}
            region={region}
            onRegionChange={region => setRegion(region)}
          />
          {
            !isLoading && !region && <ErrorMessage message="Region is required" />
          }
        </div>
        <div className="btn-refresh">
          <Button
            disabled={isLoading}
            className="btn-refresh-text"
            variant="outlined"
            aria-label="cancel Batch"
            onClick={listDagInfoAPI}
          >
            <div>REFRESH</div>
          </Button>
        </div>
      </div>
      
      {dagList.length > 0 ? (
        <>
          <div className="notebook-templates-list-table-parent">
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              isLoading={isLoading}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="Vertex schedulers"
            />
            {dagList.length > 100 && (
              <PaginationView
                pageSize={pageSize}
                setPageSize={setPageSize}
                pageIndex={pageIndex}
                allData={dagList}
                previousPage={previousPage}
                nextPage={nextPage}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                scheduleSelected="vertex"
              />
            )}
            {deletePopupOpen && (
              <DeletePopup
                onCancel={() => handleCancelDelete()}
                onDelete={() => handleDeleteScheduler()}
                deletePopupOpen={deletePopupOpen}
                DeleteMsg={`This will delete ${scheduleDisplayName} and cannot be undone.`}
                deletingSchedule={deletingSchedule}
              />
            )}
          </div>
        </>
      ) : (
        <div>
          {isLoading && (
            <div className="spin-loader-main">
              <CircularProgress
                className="spin-loader-custom-style"
                size={18}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
              Loading Vertex Schedules
            </div>
          )}
          {!isLoading && (
            <div className="no-data-style">No rows to display</div>
          )}
        </div>
      )}
    </div>
  );
}
export default ListVertexScheduler;
