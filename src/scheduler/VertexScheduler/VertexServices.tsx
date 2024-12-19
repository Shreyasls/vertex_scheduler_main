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

import { toast } from 'react-toastify';
import { JupyterLab } from '@jupyterlab/application';
import { requestAPI } from '../../handler/handler';
import { DataprocLoggingService, LOG_LEVEL } from '../../utils/loggingService';
import { toastifyCustomStyle } from '../../utils/utils';
import { Dayjs } from 'dayjs';

interface IMachineType {
    machineType: string
    acceleratorConfigs: AcceleratorConfig[]
}

interface AcceleratorConfig {
    acceleratorType: string
    allowedCounts: number[]
}

interface IPayload {
    input_filename: string;
    display_name: string;
    machine_type: string | null;
    accelerator_type?: string | null;
    accelerator_count?: string | null;
    kernel_name: string | null;
    schedule_value: string | undefined;
    time_zone?: string;
    max_run_count: string | number;
    region: string;
    cloud_storage_bucket: string | null;
    parameters: string[];
    service_account: string | undefined,
    network: string | undefined;
    subnetwork: string | undefined;
    start_time: string | null | undefined;
    end_time: string | null | undefined;
}

interface IDagList {
    displayName: string;
    schedule: string;
    status: string;
}

interface IUpdateSchedulerAPIResponse {
    status: number;
    error: string;
}

interface DeleteSchedulerAPIResponse {
    done: boolean;
    metadata: object;
    name: string;
    response: object;
}

interface TriggerSchedule {
    metedata: object;
    name: string;
}


interface IDagRunList {
    dagRunId: string;
    startDate: string;
    endDate: string;
    gcsUrl: string;
    state: string;
    date: Date;
    time: string;
}

export class VertexServices {
    static getParentProjectAPIService = async (
        setHostProject: (value: string) => void,
    ) => {
        try {
            const formattedResponse: any = await requestAPI(`api/compute/getXpnHost`);
            if (formattedResponse.length === 0) {
                // Handle the case where the list is empty
                toast.error(
                    'No machine type in this region',
                    toastifyCustomStyle
                );
                setHostProject('')
            } else {
                if (formattedResponse) {
                    setHostProject(formattedResponse);
                }
            }
        } catch (error) {
            DataprocLoggingService.log(
                'Error listing machine type',
                LOG_LEVEL.ERROR
            );
            setHostProject('')
            // toast.error(
            //     `Failed to fetch machine type list`,
            //     toastifyCustomStyle
            // );
        }
    };
    static machineTypeAPIService = async (
        region: string,
        setMachineTypeList: (value: IMachineType[]) => void,
        setMachineTypeLoading: (value: boolean) => void,
    ) => {
        try {
            setMachineTypeLoading(true)
            const formattedResponse: any = await requestAPI(`api/vertex/uiConfig?region_id=${region}`);
            if (formattedResponse.length === 0) {
                // Handle the case where the list is empty
                setMachineTypeList([])
                toast.error(
                    'No machine type in this region',
                    toastifyCustomStyle
                );
            } else {
                if (formattedResponse) {
                    setMachineTypeList(formattedResponse);
                }
            }
            setMachineTypeLoading(false)
        } catch (error) {
            setMachineTypeList([])
            setMachineTypeLoading(false)
            DataprocLoggingService.log(
                'Error listing machine type',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch machine type list`,
                toastifyCustomStyle
            );
        }
    };

    static cloudStorageAPIService = async (
        setCloudStorageList: (value: string[]) => void,
        setCloudStorageLoading: (value: boolean) => void
    ) => {
        try {
            setCloudStorageLoading(true)
            const formattedResponse: any = await requestAPI(`api/storage/listBucket`);
            if (formattedResponse.length > 0) {
                setCloudStorageList(formattedResponse)
            } else {
                setCloudStorageList([])
                toast.error(
                    'No cloud storage buckets',
                    toastifyCustomStyle
                );
            }
            setCloudStorageLoading(false)
        } catch (error) {
            setCloudStorageList([])
            setCloudStorageLoading(false)
            DataprocLoggingService.log(
                'Error listing cloud storage bucket',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch cloud storage bucket`,
                toastifyCustomStyle
            );
        }
    };

    static serviceAccountAPIService = async (
        setServiceAccountList: (
            value: { displayName: string; email: string }[]
        ) => void,
        setServiceAccountLoading: (value: boolean) => void
    ) => {
        try {
            setServiceAccountLoading(true)
            const formattedResponse: any = await requestAPI(`api/iam/listServiceAccount`);
            if (formattedResponse.length === 0) {
                // Handle the case where the list is empty
                toast.error(
                    'No service accounts',
                    toastifyCustomStyle
                );
                setServiceAccountList([])
            } else {
                const serviceAccountList = formattedResponse.map((account: { displayName: any; email: any; }) => ({
                    displayName: account.displayName,
                    email: account.email
                }));
                serviceAccountList.sort();
                setServiceAccountList(serviceAccountList);
            }
            setServiceAccountLoading(false)
        } catch (error) {
            setServiceAccountList([])
            setServiceAccountLoading(false)
            DataprocLoggingService.log(
                'Error listing service accounts',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch service accounts list`,
                toastifyCustomStyle
            );
        }
    };

    static primaryNetworkAPIService = async (
        setPrimaryNetworkList: (value: { name: string; link: string }[]) => void,
        setPrimaryNetworkLoading: (value: boolean) => void
    ) => {
        try {
            setPrimaryNetworkLoading(true)
            const formattedResponse: any = await requestAPI(`api/compute/network`);
            if (formattedResponse.length === 0) {
                setPrimaryNetworkList([])
                toast.error(
                    'No primary networks',
                    toastifyCustomStyle
                );
            } else {
                const primaryNetworkList = formattedResponse.map((network: { name: any; selfLink: any; }) => ({
                    name: network.name,
                    link: network.selfLink
                }));
                // let primaryList: string[] = [];
                // formattedResponse.forEach((data: { name: string; }) => {
                //     primaryList.push(data.name);
                // });
                primaryNetworkList.sort();
                setPrimaryNetworkList(primaryNetworkList);
            }
            setPrimaryNetworkLoading(false)
        } catch (error) {
            setPrimaryNetworkList([])
            setPrimaryNetworkLoading(false)
            DataprocLoggingService.log(
                'Error listing primary network',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch primary network list`,
                toastifyCustomStyle
            );
        }
    };

    static subNetworkAPIService = async (
        region: string,
        primaryNetworkSelected: string | undefined,
        setSubNetworkList: (value: { name: string; link: string }[]) => void,
        setSubNetworkLoading: (value: boolean) => void
    ) => {
        try {
            setSubNetworkLoading(true)
            const formattedResponse: any = await requestAPI(`api/compute/subNetwork?region_id=${region}&network_id=${primaryNetworkSelected}`);
            if (formattedResponse.length === 0) {
                setSubNetworkList([])
                toast.error(
                    'No sub networks',
                    toastifyCustomStyle
                );
            } else {
                // let subNetworkList: string[] = [];
                // formattedResponse.forEach((data: { name: string }) => {
                //     subNetworkList.push(data.name);
                // });
                const subNetworkList = formattedResponse.map((network: { name: any; selfLink: any; }) => ({
                    name: network.name,
                    link: network.selfLink
                }));
                subNetworkList.sort();
                setSubNetworkList(subNetworkList);
            }
            setSubNetworkLoading(false)
        } catch (error) {
            setSubNetworkList([])
            setSubNetworkLoading(false)
            DataprocLoggingService.log(
                'Error listing sub networks',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch sub networks list`,
                toastifyCustomStyle
            );
        }
    };

    static sharedNetworkAPIService = async (
        setSharedNetworkList: (value: { name: string; network: string, subnetwork: string }[]) => void,
        setSharedNetworkLoading: (value: boolean) => void
    ) => {
        try {
            setSharedNetworkLoading(true)
            const formattedResponse: any = await requestAPI(`api/compute/sharedNetwork`);
            if (formattedResponse.length === 0) {
                setSharedNetworkList([])
                toast.error(
                    'No shared networks',
                    toastifyCustomStyle
                );
            } else {
                // let sharedNetworkList: string[] = [];
                // formattedResponse.forEach((data: { subnetwork: string }) => {
                //     sharedNetworkList.push(data.subnetwork);
                // });
                const sharedNetworkList = formattedResponse.map((network: { network: string; subnetwork: any; }) => ({
                    name: network.network.split('/').pop(),
                    network: network.network,
                    subnetwork: network.subnetwork
                }));
                sharedNetworkList.sort();
                setSharedNetworkList(sharedNetworkList);
            }
            setSharedNetworkLoading(false)
        } catch (error) {
            setSharedNetworkList([])
            setSharedNetworkLoading(false)
            DataprocLoggingService.log(
                'Error listing shared networks',
                LOG_LEVEL.ERROR
            );
            toast.error(
                `Failed to fetch shared networks list`,
                toastifyCustomStyle
            );
        }
    };

    static createVertexSchedulerService = async (
        payload: IPayload,
        app: JupyterLab,
        setCreateCompleted: (value: boolean) => void,
        setCreatingVertexScheduler: (value: boolean) => void,
        editMode: boolean
    ) => {
        setCreatingVertexScheduler(true);
        try {
            const data: any = await requestAPI('api/vertex/createJobScheduler', {
                body: JSON.stringify(payload),
                method: 'POST'
            });
            if (data.error) {
                toast.error(data.error, toastifyCustomStyle);
                setCreatingVertexScheduler(false);
            } else {
                if (editMode) {
                    toast.success(
                        `Job ${payload.display_name} successfully updated`,
                        toastifyCustomStyle
                    );
                } else {
                    toast.success(
                        `Job ${payload.display_name} successfully created`,
                        toastifyCustomStyle
                    );
                }
                setCreatingVertexScheduler(false);
                setCreateCompleted(true);
            }
        } catch (reason) {
            setCreatingVertexScheduler(false);
            toast.error(
                `Error on POST {dataToSend}.\n${reason}`,
                toastifyCustomStyle
            );
        }
    };

    static listVertexSchedules = async (
        setDagList: (value: IDagList[]) => void,
        region: string,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
    ) => {
        try {
            const serviceURL = 'api/vertex/listSchedules';
            const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}`);
            if (Object.keys(formattedResponse).length !== 0) {
                if (formattedResponse.schedules.length > 0) {
                    setDagList(formattedResponse.schedules);
                    setIsLoading(false);
                    setNextPageFlag(formattedResponse?.nextPageToken)
                }
            } else {
                setDagList([]);
                setIsLoading(false);
            }
        } catch (error) {
            DataprocLoggingService.log(
                'Error listing vertex schedules',
                LOG_LEVEL.ERROR
            );
            // setTimeout(() => {
            //     toast.error(
            //         `Failed to fetch vertex schedules list`,
            //         toastifyCustomStyle
            //     );
            // }, 10000);

        }
    }

    static handleUpdateSchedulerPauseAPIService = async (
        scheduleId: string,
        region: string,
        setDagList: (value: IDagList[]) => void,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
        displayName: string
    ) => {
        try {
            const serviceURL = 'api/vertex/pauseSchedule';
            const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
                serviceURL + `?region_id=${region}&&schedule_id=${scheduleId}`,
            );
            if (Object.keys(formattedResponse).length === 0) {
                toast.success(
                    `Schedule ${displayName} updated successfully`,
                    toastifyCustomStyle
                );
                await VertexServices.listVertexSchedules(
                    setDagList,
                    region,
                    setIsLoading,
                    setNextPageFlag
                );
            } else {
                DataprocLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
                toast.error('Failed to pause schedule');
            }
        } catch (error) {
            DataprocLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
            toast.error(`Failed to pause schedule : ${error}`, toastifyCustomStyle);
        }
    };

    static handleUpdateSchedulerResumeAPIService = async (
        region: string,
        scheduleId: string,
        setDagList: (value: IDagList[]) => void,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
        displayName: string
    ) => {
        try {
            const serviceURL = 'api/vertex/resumeSchedule';
            const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
                serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
            );
            if (Object.keys(formattedResponse).length === 0) {
                toast.success(
                    `Schedule ${displayName} updated successfully`,
                    toastifyCustomStyle
                );
                await VertexServices.listVertexSchedules(
                    setDagList,
                    region,
                    setIsLoading,
                    setNextPageFlag
                );
            } else {
                DataprocLoggingService.log('Error in resume schedule', LOG_LEVEL.ERROR);
                toast.error('Failed to resume schedule');
            }
        } catch (error) {
            DataprocLoggingService.log('Error in resume schedule', LOG_LEVEL.ERROR);
            toast.error(`Failed to resume schedule : ${error}`, toastifyCustomStyle);
        }
    };

    static triggerSchedule = async (
        region: string,
        scheduleId: string,
        displayName: string
    ) => {
        try {
            const serviceURL = 'api/vertex/triggerSchedule';
            const data: TriggerSchedule = await requestAPI(
                serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
            );
            if (data.name) {
                toast.success(`${displayName} triggered successfully `, toastifyCustomStyle);
            }
            else {
                toast.error(
                    `Failed to Trigger ${displayName}`,
                    toastifyCustomStyle
                );
            }
        } catch (reason) {
            toast.error(
                `Failed to Trigger ${displayName} : ${reason}`,
                toastifyCustomStyle
            );
        }
    };

    static handleDeleteSchedulerAPIService = async (
        region: string,
        scheduleId: string,
        displayName: string,
        setDagList: (value: IDagList[]) => void,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
    ) => {
        try {
            const serviceURL = `api/vertex/deleteSchedule`;
            const deleteResponse: DeleteSchedulerAPIResponse = await requestAPI(
                serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`, { method: 'DELETE' }
            );
            if (deleteResponse.done) {
                await VertexServices.listVertexSchedules(
                    setDagList,
                    region,
                    setIsLoading,
                    setNextPageFlag
                );
                toast.success(
                    `Deleted job ${displayName}. It might take a few minutes to for it to be deleted from the list of jobs.`,
                    toastifyCustomStyle
                );
            } else {
                toast.error(`Failed to delete the ${displayName}`, toastifyCustomStyle);
            }
        } catch (error) {
            DataprocLoggingService.log('Error in Delete api', LOG_LEVEL.ERROR);
            toast.error(
                `Failed to delete the ${displayName} : ${error}`,
                toastifyCustomStyle
            );
        }
    };

    static editVertexSchedulerService = async (
        scheduleId: string,
        region: string,
        setInputNotebookFilePath: (value: string) => void,
        setEditNotebookLoading: (value: string) => void,
    ) => {
        setEditNotebookLoading(scheduleId);
        try {
            const serviceURL = `api/vertex/getSchedule`;
            const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
            );
            if (formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.hasOwnProperty("gcsNotebookSource")) {
                setInputNotebookFilePath(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsNotebookSource.uri);
            } else {
                setEditNotebookLoading('');
                toast.error(
                    `File path not found`,
                    toastifyCustomStyle
                );
            }

        } catch (reason) {
            setEditNotebookLoading('');
            toast.error(
                `Error in updating notebook.\n${reason}`,
                toastifyCustomStyle
            );
        }
    };

    static executionHistoryServiceList = async (
        region: string,
        schedulerData: any,
        selectedMonth: Dayjs | null,
        setIsLoading: (value: boolean) => void,
        setDagRunsList: (value: IDagRunList[]) => void,
        setBlueListDates: (value: string[]) => void,
        setGreyListDates: (value: string[]) => void,
        setOrangeListDates: (value: string[]) => void,
        setRedListDates: (value: string[]) => void,
        setGreenListDates: (value: string[]) => void,
        setDarkGreenListDates: (value: string[]) => void,
    ) => {
        setIsLoading(true)
        let selected_month = selectedMonth && selectedMonth.toISOString()
        // console.log(selected_date)
        let schedule_id = schedulerData.name.split('/').pop()
        const serviceURL = `api/vertex/listNotebookExecutionJobs`;
        // const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}&schedule_id=${scheduleId}&start_date=2024-12-12T00:00:00.000Z`
        const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}&schedule_id=${schedule_id}&start_date=${selected_month}`
        );
        try {
            let transformDagRunListDataCurrent = [];
            if (formattedResponse && formattedResponse.length > 0) {
                transformDagRunListDataCurrent = formattedResponse.map((dagRun: { createTime: string | number | Date; updateTime: string | number | Date; name: string; gcsOutputUri: any; jobState: string; }) => {
                    const createTime = new Date(dagRun.createTime);
                    const updateTime = new Date(dagRun.updateTime);
                    const timeDifferenceMilliseconds = updateTime.getTime() - createTime.getTime(); // Difference in milliseconds
                    const totalSeconds = Math.floor(timeDifferenceMilliseconds / 1000); // Convert to seconds
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    return {
                        dagRunId: dagRun.name.split('/').pop(),
                        // filteredDate: new Date(dagRun.createTime)
                        // .toDateString()
                        // .split(' ')[2],
                        startDate: dagRun.createTime,
                        endDate: dagRun.updateTime,
                        gcsUrl: dagRun.gcsOutputUri,
                        state: dagRun.jobState.split('_')[2].toLowerCase(),
                        date: new Date(dagRun.createTime).toDateString(),
                        time: `${minutes} min ${seconds} sec`
                    };
                });
            }
            // Group data by date and state
            const groupedDataByDateStatus = transformDagRunListDataCurrent.reduce((result: { [x: string]: { [x: string]: { date: any; state: any; }[]; }; }, item: { date: any; state: any; }) => {
                const date = item.date; // Group by date
                const status = item.state; // Group by state

                if (!result[date]) {
                    result[date] = {};
                }

                if (!result[date][status]) {
                    result[date][status] = [];
                }

                result[date][status].push(item);

                return result;
            }, {});

            // Initialize grouping lists
            let blueList: string[] = [];
            let greyList: string[] = [];
            let orangeList: string[] = [];
            let redList: string[] = [];
            let greenList: string[] = [];
            let darkGreenList: string[] = [];

            // Process grouped data
            Object.keys(groupedDataByDateStatus).forEach((dateValue) => {
                if (groupedDataByDateStatus[dateValue].running) {
                    blueList.push(dateValue);
                } else if (groupedDataByDateStatus[dateValue].queued) {
                    greyList.push(dateValue);
                } else if (
                    groupedDataByDateStatus[dateValue].failed &&
                    groupedDataByDateStatus[dateValue].succeeded
                ) {
                    orangeList.push(dateValue);
                } else if (groupedDataByDateStatus[dateValue].failed) {
                    redList.push(dateValue);
                } else if (
                    groupedDataByDateStatus[dateValue].succeeded &&
                    groupedDataByDateStatus[dateValue].succeeded.length === 1
                ) {
                    greenList.push(dateValue);
                } else {
                    darkGreenList.push(dateValue);
                }
            });
            // Update state lists with their respective transformations
            setBlueListDates(blueList);
            setGreyListDates(greyList);
            setOrangeListDates(orangeList);
            setRedListDates(redList);
            setGreenListDates(greenList);
            setDarkGreenListDates(darkGreenList);
            console.log(transformDagRunListDataCurrent.length)
            setDagRunsList(transformDagRunListDataCurrent)
        } catch (error) {
            toast.error(
                `Error in fetching the execution history`,
                toastifyCustomStyle
            );
        }
        setIsLoading(false)
    };

    static vertexJobTaskLogsListService = async (
        dagRunId: string | undefined,
        jobRunsData: IDagRunList | undefined,
        setDagTaskInstancesList: (value: any) => void,
        setIsLoading: (value: boolean) => void
    ) => {
        setDagTaskInstancesList([]);
        setIsLoading(true);
        const start_date = encodeURIComponent(jobRunsData?.startDate || '');
        const end_date = encodeURIComponent(jobRunsData?.endDate || '');
        console.log(start_date)
        console.log(end_date)
        try {
            //   dagRunId = encodeURIComponent(dagRunId);
            const data: any = await requestAPI(
                `api/logEntries/listEntries?filter_query=timestamp >= \"${start_date}" AND timestamp <= \"${end_date}" AND SEARCH(\"${dagRunId}\")`
            );
            // console.log(data)
            //   data.task_instances.sort(
            //     (a: any, b: any) =>
            //       new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            //   );
            let transformDagRunTaskInstanceListData = [];
            transformDagRunTaskInstanceListData = data.map(
                (dagRunTask: { severity: any; textPayload: any; timestamp: string | number | Date; }) => {
                    return {
                        severity: dagRunTask.severity,
                        textPayload: dagRunTask.textPayload && dagRunTask.textPayload ? dagRunTask.textPayload : '',
                        // duration: dagRunTask.duration,
                        // state: dagRunTask.state,
                        date: new Date(dagRunTask.timestamp).toDateString(),
                        time: new Date(dagRunTask.timestamp).toTimeString().split(' ')[0],
                        fullData: dagRunTask,
                    };
                }
            );
            setDagTaskInstancesList(transformDagRunTaskInstanceListData);
            setIsLoading(false);
        } catch (reason) {
            setIsLoading(false);
            setDagTaskInstancesList([]);
            // if (!toast.isActive('credentialsError')) {
            //     toast.error(`Error on GET credentials..\n${reason}`, {
            //         ...toastifyCustomStyle,
            //         toastId: 'credentialsError'
            //     });
            // }
        }
    };
}