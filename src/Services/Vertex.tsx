/**
 * @license
 * Copyright 2024 Google LLC
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
import { JupyterLab } from "@jupyterlab/application";
import { toast } from "react-toastify";
import { Dayjs } from "dayjs";
import { requestAPI } from "../handler/handler";
import { DataprocLoggingService, LOG_LEVEL } from "../utils/loggingService";
import { toastifyCustomStyle } from "../utils/utils";
import { ICreatePayload, IDagList, IDagRunList, IDeleteSchedulerAPIResponse, IMachineType, ITriggerSchedule, IUpdateSchedulerAPIResponse } from "../scheduler/VertexScheduler/VertexInterfaces";
import { scheduleMode } from "../utils/const";

export class VertexServices {
    static machineTypeAPIService = async (
        region: string,
        setMachineTypeList: (value: IMachineType[]) => void,
        setMachineTypeLoading: (value: boolean) => void,
    ) => {
        try {
            setMachineTypeLoading(true)
            const formattedResponse: any = await requestAPI(`api/vertex/uiConfig?region_id=${region}`);
            if (formattedResponse.length === 0) {
                setMachineTypeList([])
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
    static createVertexSchedulerService = async (
        payload: ICreatePayload,
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
            setDagList([]);
            DataprocLoggingService.log(
                'Error listing vertex schedules',
                LOG_LEVEL.ERROR
            );

        }
    }
    static handleUpdateSchedulerPauseAPIService = async (
        scheduleId: string,
        region: string,
        setDagList: (value: IDagList[]) => void,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
        displayName: string,
        setResumeLoading: (value: string) => void,
    ) => {
        setResumeLoading(scheduleId);
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
                setResumeLoading('');
            } else {
                setResumeLoading('');
                DataprocLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
                toast.error('Failed to pause schedule');
            }
        } catch (error) {
            setResumeLoading('');
            DataprocLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
            toast.error(`Failed to pause schedule : ${error}`, toastifyCustomStyle);
        }
    };

    static handleUpdateSchedulerResumeAPIService = async (
        scheduleId: string,
        region: string,
        setDagList: (value: IDagList[]) => void,
        setIsLoading: (value: boolean) => void,
        setNextPageFlag: (value: string) => void,
        displayName: string,
        setResumeLoading: (value: string) => void,
    ) => {
        setResumeLoading(scheduleId);
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
                setResumeLoading('');
            } else {
                setResumeLoading('');
                DataprocLoggingService.log('Error in resume schedule', LOG_LEVEL.ERROR);
                toast.error('Failed to resume schedule');
            }
        } catch (error) {
            setResumeLoading('');
            DataprocLoggingService.log('Error in resume schedule', LOG_LEVEL.ERROR);
            toast.error(`Failed to resume schedule : ${error}`, toastifyCustomStyle);
        }
    };

    static triggerSchedule = async (
        region: string,
        scheduleId: string,
        displayName: string,
        setTriggerLoading:  (value: string) => void,
    ) => {
        setTriggerLoading(scheduleId);
        try {
            const serviceURL = 'api/vertex/triggerSchedule';
            const data: ITriggerSchedule = await requestAPI(
                serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
            );
            if (data.name) {
                setTriggerLoading('');
                toast.success(`${displayName} triggered successfully `, toastifyCustomStyle);
            }
            else {
                setTriggerLoading('');
                toast.error(
                    `Failed to Trigger ${displayName}`,
                    toastifyCustomStyle
                );
            }
        } catch (reason) {
            setTriggerLoading('');
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
            const deleteResponse: IDeleteSchedulerAPIResponse = await requestAPI(
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

    static editVertexSJobService = async (
        jobId: string,
        region: string,
        setInputNotebookFilePath: (value: string) => void,
        setEditDagLoading: (value: string) => void,
        setCreateCompleted: (value: boolean) => void,
        setInputFileSelected: (value: string) => void,
        setRegion: (value: string) => void,
        setMachineTypeSelected: (value: string | null) => void,
        setAcceleratedCount: (value: string | null) => void,
        setAcceleratorType: (value: string | null) => void,
        setKernelSelected: (value: string | null) => void,
        setCloudStorage: (value: string | null) => void,
        setDiskTypeSelected: (value: string | null) => void,
        setDiskSize: (value: string) => void,
        setParameterDetail: (value: string[]) => void,
        setParameterDetailUpdated: (value: string[]) => void,
        setServiceAccountSelected: (value: { displayName: string; email: string } | null) => void,
        setPrimaryNetworkSelected: (value: { name: string; link: string } | null) => void,
        setPrimaryNetworkList: (value: { name: string; link: string }[]) => void,
        setSubNetworkSelected: (value: { name: string; link: string } | null) => void,
        setSubNetworkList: (value: { name: string; link: string }[]) => void,
        setSharedNetworkSelected: (value: { name: string; network: string, subnetwork: string } | null) => void,
        setScheduleMode: (value: scheduleMode) => void,
        setScheduleValue: (value: string) => void,
        setScheduleField: (value: string) => void,
        setStartDate: (value: Date | null) => void,
        setEndDate: (value: Date | null) => void,
        setMaxRuns: (value: string) => void,
        setTimeZoneSelected: (value: string) => void,
        setEditMode: (value: boolean) => void,
        setJobNameSelected: (value: string) => void,
        setServiceAccountList: (value: { displayName: string; email: string }[]) => void,
        setNetworkSelected: (value: string) => void
    ) => {
        setEditDagLoading(jobId);
        try {
            const serviceURL = `api/vertex/getSchedule`;
            const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}&schedule_id=${jobId}`
            );
            if (formattedResponse && Object.keys(formattedResponse).length > 0) {
                const inputFileName = formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsNotebookSource.uri.split('/');
                setInputFileSelected(inputFileName[inputFileName.length - 1]);
                setCreateCompleted(false);
                setRegion(region);
                setJobNameSelected(formattedResponse.displayName);
                setMachineTypeSelected(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.machineSpec.machineType)
                setAcceleratedCount(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.machineSpec.acceleratorCount)
                setAcceleratorType(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.machineSpec.acceleratorType)
                setKernelSelected(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.kernelName)
                setCloudStorage( formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsOutputUri.replace('gs://', ''))
                setDiskTypeSelected(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.persistentDiskSpec.diskType)
                setDiskSize(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.persistentDiskSpec.diskSizeGb)

                const parameterList = Object.keys(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.labels).map((key) => key +":"+ formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.labels[key])
                setParameterDetail(parameterList);
                setParameterDetailUpdated(parameterList);
                setServiceAccountSelected({ displayName: '', email: formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.serviceAccount });

                const primaryNetwork = formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.networkSpec.network.split('/');
                setPrimaryNetworkSelected({ name: primaryNetwork[primaryNetwork.length - 1], link: primaryNetwork[primaryNetwork.length - 1] });
                setPrimaryNetworkList([{ name: primaryNetwork[primaryNetwork.length - 1], link: primaryNetwork[primaryNetwork.length - 1] }]);

                const subnetwork = formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.networkSpec.subnetwork.split('/');
                setSubNetworkSelected({ name: subnetwork[subnetwork.length - 1], link: subnetwork[subnetwork.length - 1] })
                setSubNetworkList([{ name: subnetwork[subnetwork.length - 1], link: subnetwork[subnetwork.length - 1] }])
                console.log('schedule mode data', formattedResponse.cron,formattedResponse.maxRunCount )
                if(formattedResponse.cron === '* * * * *' && formattedResponse.maxRunCount === '1') {
                    console.log('inside schedule mode run now')
                    setScheduleMode('runNow');
                } else {
                    console.log('inside schedule mode run on schedule')
                    setScheduleMode('runSchedule');
                }
                // setSharedNetworkSelected()
                // 
                
                setScheduleField(formattedResponse.cron);
                // const dateFormat = ((formattedResponse.startTime.getMonth() > 8) ? (formattedResponse.startTime.getMonth() + 1) : ('0' + (formattedResponse.startTime.getMonth() + 1))) + '/' + ((formattedResponse.startTime.getDate() > 9) ? formattedResponse.startTime.getDate() : ('0' + formattedResponse.startTime.getDate())) + '/' + formattedResponse.startTime.getFullYear();
                // console.log('date added', new Date(dateFormat));
                // setStartDate(new Date(dateFormat));
                // setEndDate()
                // setScheduleValue()
                setMaxRuns(formattedResponse.maxRunCount);
                // setTimeZoneSelected()
                setEditMode(true);
            } else {
                setEditDagLoading('');
                toast.error(
                    `File path not found`,
                    toastifyCustomStyle
                );
            }
            // if (formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.hasOwnProperty("gcsNotebookSource")) {
            //     setInputNotebookFilePath(formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsNotebookSource.uri);
            // } else {
            //     setEditNotebookLoading('');
            //     toast.error(
            //         `File path not found`,
            //         toastifyCustomStyle
            //     );
            // }

        } catch (reason) {
            setEditDagLoading('');
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
        let schedule_id = schedulerData.name.split('/').pop()
        const serviceURL = `api/vertex/listNotebookExecutionJobs`;
        const formattedResponse: any = await requestAPI(serviceURL + `?region_id=${region}&schedule_id=${schedule_id}&start_date=${selected_month}`
        );
        try {
            let transformDagRunListDataCurrent = [];
            if (formattedResponse && formattedResponse.length > 0) {
                transformDagRunListDataCurrent = formattedResponse.map((dagRun: any) => {
                    const createTime = new Date(dagRun.createTime);
                    const updateTime = new Date(dagRun.updateTime);
                    const timeDifferenceMilliseconds = updateTime.getTime() - createTime.getTime(); // Difference in milliseconds
                    const totalSeconds = Math.floor(timeDifferenceMilliseconds / 1000); // Convert to seconds
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    return {
                        dagRunId: dagRun.name.split('/').pop(),
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
            const groupedDataByDateStatus = transformDagRunListDataCurrent.reduce((result: any, item: any) => {
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
}