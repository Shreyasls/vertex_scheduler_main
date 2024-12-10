import React, { useEffect, useState } from 'react';
import { Input } from '../../controls/MuiWrappedInput';
import {
    Autocomplete,
    TextField,
    Radio,
    Button,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Typography,
    // Box
} from '@mui/material';
import { IThemeManager } from '@jupyterlab/apputils';
import { JupyterLab } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import LabelProperties from '../../jobs/labelProperties';
import LearnMore from '../common/LearnMore';
import { Cron } from 'react-js-cron';
import tzdata from 'tzdata';
// import Scheduler from '../common/Scheduler';
import { RegionDropdown } from '../../controls/RegionDropdown';
import { authApi } from '../../utils/utils';
import VertexScheduleJobs from './VertexScheduleJobs';
import { internalScheduleMode, scheduleMode, scheduleValueExpression } from '../../utils/const';
import { VertexServices } from './VertexServices';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
import dayjs from 'dayjs';
import { LabIcon } from '@jupyterlab/ui-components';
import errorIcon from '../../../style/icons/error_icon.svg';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// export type internalScheduleMode = 'cronFormat' | 'userFriendly';
const iconError = new LabIcon({
    name: 'launcher:error-icon',
    svgstr: errorIcon
});

const CreateVertexScheduler = ({
    themeManager,
    app,
    context,
    settingRegistry,
    createCompleted,
    setCreateCompleted,
    jobNameSelected,
    setJobNameSelected,
    inputFileSelected,
    setInputFileSelected,
    editMode,
    setEditMode,
    jobNameValidation,
    jobNameSpecialValidation,
    jobNameUniqueValidation,
    setJobNameUniqueValidation,
    notebookSelector
}: {
    themeManager: IThemeManager;
    app: JupyterLab;
    context: any;
    settingRegistry: ISettingRegistry;
    createCompleted: boolean;
    setCreateCompleted: React.Dispatch<React.SetStateAction<boolean>>;
    jobNameSelected: string;
    setJobNameSelected: React.Dispatch<React.SetStateAction<string>>;
    inputFileSelected: string;
    setInputFileSelected: React.Dispatch<React.SetStateAction<string>>;
    editMode: boolean;
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    jobNameValidation: boolean;
    jobNameSpecialValidation: boolean;
    jobNameUniqueValidation: boolean;
    setJobNameUniqueValidation: React.Dispatch<React.SetStateAction<boolean>>;
    notebookSelector: string;
}) => {

    const [parameterDetail, setParameterDetail] = useState(['']);
    const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
    const [keyValidation, setKeyValidation] = useState(-1);
    const [valueValidation, setValueValidation] = useState(-1);
    const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
    const [creatingVertexScheduler, setCreatingVertexScheduler] = useState(false);

    const [region, setRegion] = useState('');
    const [projectId, setProjectId] = useState('');
    const [kernel] = useState(['python3', 'pytorch', 'tensorflow']);
    const [kernelSelected, setKernelSelected] = useState(null);
    const [cloudStorageList, setCloudStorageList] = useState<string[]>([]);
    const [cloudStorage, setCloudStorage] = useState(null);
    const [machineTypeList, setMachineTypeList] = useState<string[]>([]);
    const [machineTypeSelected, setMachineTypeSelected] = useState(null);
    const [acceleratorType, setAcceleratorType] = useState(null);
    const [acceleratedCount, setAcceleratedCount] = useState(null);
    const [serviceAccountList, setServiceAccountList] = useState<string[]>([]);
    // const [serviceAccountList, setServiceAccountList] = useState<{ displayName: string; email: string }[]>([]);
    const [serviceAccountSelected, setServiceAccountSelected] = useState(null);
    const [networkSelected, setNetworkSelected] = useState('networkInThisProject');
    const [primaryNetworkList, setPrimaryNetworkList] = useState<string[]>([]);
    const [primaryNetworkSelected, setPrimaryNetworkSelected] = useState(null);
    const [subNetworkList, setSubNetworkList] = useState<string[]>([]);
    const [subNetworkSelected, setSubNetworkSelected] = useState<string | null>(null);
    const [sharedNetworkList, setSharedNetworkList] = useState<string[]>([]);
    const [sharedNetworkSelected, setSharedNetworkSelected] = useState(null);
    const [networkTags, setNetworkTags] = useState('');
    const [maxRuns, setMaxRuns] = useState('');
    const [scheduleField, setScheduleField] = useState('');
    const [scheduleMode, setScheduleMode] = useState<scheduleMode>('runNow');
    const [internalScheduleMode, setInternalScheduleMode] = useState<internalScheduleMode>('cronFormat');
    const [scheduleValue, setScheduleValue] = useState(scheduleValueExpression);
    const [timeZoneSelected, setTimeZoneSelected] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    console.log(cloudStorageList, serviceAccountList, primaryNetworkList, subNetworkList, sharedNetworkList)
    console.log('parameterDetail', parameterDetail)
    console.log('parameterDetailUpdated', parameterDetailUpdated)
    const timezones = Object.keys(tzdata.zones).sort();
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [endDateError, setEndDateError] = useState(false)

    // const [composerSelected, setComposerSelected] = useState('');

    const handleRegionChange = (value: React.SetStateAction<string>) => {
        setRegion(value)
        setMachineTypeSelected(null)
        setAcceleratedCount(null)
        setAcceleratorType(null)
    }
    /**
   * Kernel selection
   * @param {string} kernelSelected seleted kernel
   */
    const handleKernel = (kernelValue: any) => {
        setKernelSelected(kernelValue)
    }

    const handleSchedule = (e: any | React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Prevent space as the first character
        if (newValue === '' || newValue[0] !== ' ' || scheduleField !== '') {
            setScheduleField(newValue);
        }
        // setScheduleField(e.target.value)
    }

    /**
   * Primary Network selection
   * @param {string} primaryNetworkSelected seleted kernel
   */
    const handlePrimaryNetwork = (primaryValue: any) => {
        setPrimaryNetworkSelected(primaryValue)
        setSubNetworkSelected(subNetworkList[0])
    }

    /**
   * Service account selection
   * @param {string} serviceAccountSelected seleted kernel
   */
    const handleServiceAccountSelected = (serviceAccountalue: any) => {
        setServiceAccountSelected(serviceAccountalue)
    }
    // const handleServiceAccountChange = (
    //     event: React.ChangeEvent<{}>,
    //     value: { displayName: string; email: string } | null
    // ) => {
    //     setServiceAccountSelected(value?.displayName || '');
    //     data.serviceAccount = value?.email;
    // };
    /**
   * Sub Network selection
   * @param {string} subNetworkSelected seleted kernel
   */
    const handleSubNetwork = (subNetworkValue: any) => {
        setSubNetworkSelected(subNetworkValue)
    }

    /**
   * Primary Network selection
   * @param {string} primaryNetworkSelected seleted kernel
   */
    const handleSharedNetwork = (shredNetworkValue: any) => {
        setSharedNetworkSelected(shredNetworkValue)
    }

    /**
   * Kernel selection
   * @param {string} cloudStorage seleted kernel
   */
    const handleCloudStorageSelected = (cloudStorageValue: any) => {
        setCloudStorage(cloudStorageValue)
    }

    /**
    * Machine Type selection
    * @param {string} machineTypeSelected seleted machine type
    */
    const handleMachineType = (machineType: any) => {
        setMachineTypeSelected(machineType);
        setAcceleratedCount(null)
        setAcceleratorType(null)
    }

    /**
    * Max Runs
    * @param {string} maxRuns seleted machine type
    */
    const handleMaxRuns = (e: any | React.ChangeEvent<HTMLInputElement>) => {
        const re = /^[1-9][0-9]*$/;
        if (e.target.value === '' || re.test(e.target.value)) {
            setMaxRuns(e.target.value);
        }
    };

    /**
    * Acceleration Type listing
    * @param {Array} acceleratorConfig acceleratorConfigs data
    */
    const getAcceleratedType = (acceleratorConfig: any) => {
        return acceleratorConfig.map((item: any) => item.acceleratorType);
    }

    /**
    * Acceleration Type selection
    * @param {string} acceleratorType accelerationType type selected
    */
    const handleAccelerationType = (acceleratorType: any) => {
        setAcceleratorType(acceleratorType);
    }

    /**
    * Acceleration Count selection
    * @param {string} acceleratorCount accelerationType count selected
    */
    const handleAcceleratorCount = (acceleratorCount: any) => {
        setAcceleratedCount(acceleratorCount);
    }

    /**
    * Network selection
    * @param {string} networkSelected accelerationType type selected
    */
    const handleNetworkSelection = (eventValue: any) => {
        // console.log('network', eventValue);
        if (networkSelected === 'networkInThisProject') {
            setSharedNetworkSelected(null)
        } if (networkSelected === 'networkShared') {
            setPrimaryNetworkSelected(null)
            setSubNetworkSelected(null)
        }
        setNetworkSelected(eventValue.target.value);
    }

    /**
    * Network tags value
    * @param {string} networkTags seleted machine type
    */
    const handleNetworkTags = (e: any | React.ChangeEvent<HTMLInputElement>) => {
        setNetworkTags(e.target.value);
    };

    const handleStartDate = (val: any) => {
        setStartDate(val.$d)
        // console.log('startDate', val)
        // setStartDate(val);

        if (val && endDate && dayjs(endDate).isBefore(dayjs(val))) {
            setEndDateError(true);
        } else {
            setEndDateError(false);
        }
    }

    const handleEndDate = (val: any) => {
        if (startDate && (dayjs(val).isBefore(dayjs(startDate)) || dayjs(val).isSame(dayjs(startDate), 'minute'))) {
            setEndDateError(true);
        } else {
            setEndDateError(false);
        }
        setEndDate(val.$d)
        // console.log('endDate', val)
        // setEndDate(val);
    }

    const handleSchedulerModeChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = (event.target as HTMLInputElement).value;
        setScheduleMode(newValue as scheduleMode);
        if (newValue === 'runNow') {
            setStartDate(null)
            setEndDate(null)
            setScheduleField('')
        }
        if (newValue === 'runSchedule' && scheduleValue === '') {
            // setScheduleValue(scheduleValueExpression);
            setScheduleValue(scheduleField);
        }
        if (newValue === 'runSchedule') {
            setInternalScheduleMode("cronFormat");
        }
    };

    const handleInternalSchedulerModeChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = (event.target as HTMLInputElement).value;
        if (newValue === 'userFriendly') {
            setScheduleValue(scheduleValueExpression);
        } if (newValue === 'cronFormat') {
            setScheduleField('')
        }
        setInternalScheduleMode(newValue as internalScheduleMode);
        setStartDate(null)
        setEndDate(null)
        setMaxRuns('')
        // if (newValue === 'cronFormat' && scheduleValue === '') {
        //     setScheduleValue(scheduleValueExpression);
        // }
    };

    const handleTimeZoneSelected = (data: string | null) => {
        if (data) {
            const selectedTimeZone = data.toString();
            setTimeZoneSelected(selectedTimeZone);
        }
    };

    const machineTypeAPI = async () => {
        await VertexServices.machineTypeAPIService(region, setMachineTypeList);
    };

    const cloudStorageAPI = async () => {
        await VertexServices.cloudStorageAPIService(setCloudStorageList);
    };

    const serviceAccountAPI = async () => {
        await VertexServices.serviceAccountAPIService(setServiceAccountList);
    };

    const primaryNetworkAPI = async () => {
        await VertexServices.primaryNetworkAPIService(setPrimaryNetworkList);
    };

    const subNetworkAPI = async () => {
        await VertexServices.subNetworkAPIService(region, setSubNetworkList);
    };

    const sharedNetworkAPI = async () => {
        await VertexServices.sharedNetworkAPIService(setSharedNetworkList);
    };

    /**
    * Disable the create button when the mandatory fields are not filled and the validations is not proper.
    */
    const isSaveDisabled = () => {
        return (
            jobNameSelected === '' ||
            region === null ||
            creatingVertexScheduler ||
            machineTypeSelected === null ||
            kernelSelected === null ||
            cloudStorage === null ||
            (parameterDetailUpdated.some(item => item.length === 1)) ||
            (networkSelected === 'networkInThisProject' && (primaryNetworkSelected === null || subNetworkSelected === null)) ||
            (networkSelected === 'networkShared' && (sharedNetworkSelected === null)) ||
            ((scheduleMode === 'runSchedule' && internalScheduleMode === 'cronFormat') && (scheduleField === '')) ||
            // (!jobNameValidation && !editMode) ||
            // (jobNameSpecialValidation && !editMode) ||
            // (!jobNameUniqueValidation && !editMode) ||
            inputFileSelected === ''
        );
    };

    const getScheduleValues = () => {
        if (scheduleMode === 'runNow') {
            return '* * * * *'
        } if (scheduleMode === 'runSchedule' && internalScheduleMode === 'cronFormat') {
            return scheduleField
        } if (scheduleMode === 'runSchedule' && internalScheduleMode === 'userFriendly') {
            return scheduleValue
        }
    }

    /**
    * Create a job schedule
    */
    const handleCreateJobScheduler = async () => {
        const payload = {
            input_filename: inputFileSelected,
            display_name: jobNameSelected,
            machine_type: machineTypeSelected,
            accelerator_type: acceleratorType,
            accelerator_count: acceleratedCount,
            kernel_name: kernelSelected,
            schedule_value: getScheduleValues(),
            time_zone: timeZoneSelected,
            max_run_count: scheduleMode === 'runNow' ? 1 : maxRuns,
            region: region,
            cloud_storage_bucket: cloudStorage,
            parameters: parameterDetailUpdated,
            service_account: serviceAccountSelected,
            network: '',
            subnetwork: subNetworkSelected,
            start_time: startDate,
            end_time: endDate,
        }
        console.log(payload)
        await VertexServices.createVertexSchedulerService(
          payload,
          app,
          setCreateCompleted,
          setCreatingVertexScheduler,
          editMode
        );
        // setEditMode(false);
    }

    /**
    * Cancel a job schedule
    */
    const handleCancel = async () => {
        if (!editMode) {
            setCreateCompleted(false);
            app.shell.activeWidget?.close();
        } else {
            setCreateCompleted(true);
        }
    };

    useEffect(() => {
        if (!createCompleted) {
            if (region !== '') {
                machineTypeAPI()
                subNetworkAPI()
            }
            cloudStorageAPI()
            serviceAccountAPI()
            primaryNetworkAPI()
            sharedNetworkAPI()
        }
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
    }, [projectId]);

    // console.log({ 'startDate': startDate, 'endDate': endDate });

    return (
        <>
            {
                createCompleted ?
                    <VertexScheduleJobs
                        app={app}
                        themeManager={themeManager}
                        settingRegistry={settingRegistry}
                    // composerSelectedFromCreate='vertex'
                    // setCreateCompleted={setCreateCompleted}
                    // setJobNameSelected={setJobNameSelected}
                    // setComposerSelected={setComposerSelected}
                    // setScheduleMode={setScheduleMode}
                    // setScheduleValue={setScheduleValue}
                    // setInputFileSelected={setInputFileSelected}
                    // setParameterDetail={setParameterDetail}
                    // setParameterDetailUpdated={setParameterDetailUpdated}
                    // setSelectedMode={setSelectedMode}
                    // setClusterSelected={setClusterSelected}
                    // setServerlessSelected={setServerlessSelected}
                    // setServerlessDataSelected={setServerlessDataSelected}
                    // serverlessDataList={serverlessDataList}
                    // setServerlessDataList={setServerlessDataList}
                    // setServerlessList={setServerlessList}
                    // setRetryCount={setRetryCount}
                    // setRetryDelay={setRetryDelay}
                    // setEmailOnFailure={setEmailOnFailure}
                    // setEmailonRetry={setEmailonRetry}
                    // setEmailOnSuccess={setEmailOnSuccess}
                    // setEmailList={setEmailList}
                    // setStopCluster={setStopCluster}
                    // setTimeZoneSelected={setTimeZoneSelected}
                    // setEditMode={setEditMode}
                    // setIsLoadingKernelDetail={setIsLoadingKernelDetail}
                    />
                    :
                    <div className='submit-job-container'>

                        <div className="region-overlay create-scheduler-form-element">
                            <RegionDropdown
                                projectId={projectId}
                                region={region}
                                onRegionChange={region => handleRegionChange(region)}
                            />
                        </div>

                        <div className="create-scheduler-form-element">
                            <Autocomplete
                                className="create-scheduler-style"
                                options={machineTypeList && machineTypeList.map((item: any) => item.machineType)}
                                // options={machineTypeList && machineTypeList}
                                value={machineTypeSelected}
                                onChange={(_event, val) => handleMachineType(val)}
                                renderInput={params => (
                                    <TextField {...params} label="Machine type*" />
                                )}
                                clearIcon={false}
                            //disabled={editMode}
                            />
                        </div>

                        {
                            machineTypeList && machineTypeList.map((item: any) => {
                                if ("acceleratorConfigs" in item && item.machineType === machineTypeSelected && item.acceleratorConfigs !== null) {
                                    return (
                                        // console.log('getAcceleratedType(item.acceleratorConfigs)', getAcceleratedType(item.acceleratorConfigs)),
                                        <div className="execution-history-main-wrapper">
                                            <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                                                <Autocomplete
                                                    className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                    options={getAcceleratedType(item.acceleratorConfigs)}
                                                    value={acceleratorType}
                                                    onChange={(_event, val) => handleAccelerationType(val)}
                                                    renderInput={params => (
                                                        <TextField {...params} label="Accelerator type*" />
                                                    )}
                                                //disabled={editMode}
                                                />
                                            </div>

                                            {
                                                item?.acceleratorConfigs?.map((element: { allowedCounts: any[]; acceleratorType: string; }) => {
                                                    return (
                                                        // console.log("element.allowedCounts", element.allowedCounts),
                                                        <>
                                                            {
                                                                element.acceleratorType === acceleratorType ? <div className="create-scheduler-form-element create-scheduler-form-element-input-fl">
                                                                    <Autocomplete
                                                                        className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                                        options={element.allowedCounts.map(item => item.toString())}
                                                                        value={acceleratedCount}
                                                                        onChange={(_event, val) => handleAcceleratorCount(val)}
                                                                        renderInput={params => (
                                                                            <TextField {...params} label="Accelerator count*" />
                                                                        )}
                                                                    //disabled={editMode}
                                                                    />
                                                                </div> : null
                                                            }
                                                        </>
                                                    )
                                                })
                                            }

                                        </div>
                                    )
                                }
                            })
                        }


                        <div className="create-scheduler-form-element">
                            <Autocomplete
                                className="create-scheduler-style"
                                options={kernel}
                                value={kernelSelected}
                                onChange={(_event, val) => handleKernel(val)}
                                renderInput={params => (
                                    <TextField {...params} label="Kernel*" />
                                )}
                                clearIcon={false}
                            //disabled={editMode}
                            />
                        </div>

                        <div className="create-scheduler-form-element">
                            <Autocomplete
                                className="create-scheduler-style"
                                options={cloudStorageList}
                                value={cloudStorage}
                                onChange={(_event, val) => handleCloudStorageSelected(val)}
                                renderInput={params => (
                                    <TextField {...params} label="Cloud Storage Bucket*" />
                                )}
                                clearIcon={false}
                            //disabled={editMode}
                            />
                        </div>
                        <span className="tab-description tab-text-sub-cl">Where results are stored. Select an existing bucket or create a new one.</span>

                        <>
                            <div className="create-job-scheduler-title sub-title-heading ">
                                Parameters
                            </div>
                            <LabelProperties
                                labelDetail={parameterDetail}
                                setLabelDetail={setParameterDetail}
                                labelDetailUpdated={parameterDetailUpdated}
                                setLabelDetailUpdated={setParameterDetailUpdated}
                                buttonText="ADD PARAMETER"
                                keyValidation={keyValidation}
                                setKeyValidation={setKeyValidation}
                                valueValidation={valueValidation}
                                setValueValidation={setValueValidation}
                                duplicateKeyError={duplicateKeyError}
                                setDuplicateKeyError={setDuplicateKeyError}
                            />
                        </>

                        <div className="create-scheduler-form-element panel-margin">
                            {/* <Autocomplete
                                className="create-scheduler-style-trigger"
                                options={serviceAccountList}
                                getOptionLabel={option => option.displayName}
                                value={
                                    serviceAccountSelected.find(
                                        option => option.displayName === serviceAccountSelected
                                    ) || null
                                }
                                onChange={handleServiceAccountChange}
                                renderInput={params => (
                                    <TextField {...params} label="Service account " />
                                )}
                                renderOption={(props, option) => (
                                    <Box
                                        component="li"
                                        {...props}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <Typography variant="body1">
                                            {option.displayName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {option.email}
                                        </Typography>
                                    </Box>
                                )}
                            /> */}
                            <Autocomplete
                                className="create-scheduler-style"
                                options={serviceAccountList && serviceAccountList.map((item: any) => item.displayName)}
                                value={serviceAccountSelected}
                                onChange={(_event, val) => handleServiceAccountSelected(val)}
                                renderInput={params => (
                                    <TextField {...params} label="Service account" />
                                )}
                            //disabled={editMode}
                            />
                        </div>

                        <div className="create-job-scheduler-text-para create-job-scheduler-sub-title">
                            Network Configuration
                        </div>

                        <p>Establishes connectivity for VM instances in the cluster</p>

                        <div className="create-scheduler-form-element panel-margin">
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="demo-controlled-radio-buttons-group"
                                    name="controlled-radio-buttons-group"
                                    value={networkSelected}
                                    onChange={handleNetworkSelection}
                                >
                                    <FormControlLabel
                                        value="networkInThisProject"
                                        className="create-scheduler-label-style"
                                        control={<Radio size="small" />}
                                        label={
                                            <Typography sx={{ fontSize: 13 }}>
                                                Network in this project
                                            </Typography>
                                        }
                                    />
                                    <div>
                                        <span className="sub-para tab-text-sub-cl">Choose a shared VPC network from the project that is different from the clusters project</span>
                                        <LearnMore />
                                    </div>
                                    <FormControlLabel
                                        value="networkShared"
                                        className="create-scheduler-label-style"
                                        control={<Radio size="small" />}
                                        label={
                                            <Typography sx={{ fontSize: 13 }}>Network shared from host project</Typography>
                                        }
                                    />
                                    <span className="sub-para tab-text-sub-cl">Choose a shared VPC network from the project that is different from the clusters project</span>
                                    <LearnMore />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        {/* Network in this project  */}
                        {
                            networkSelected === 'networkInThisProject' ?
                                <>
                                    <div className="execution-history-main-wrapper">
                                        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                                            <Autocomplete
                                                className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                options={primaryNetworkList}
                                                value={primaryNetworkSelected}
                                                onChange={(_event, val) => handlePrimaryNetwork(val)}
                                                renderInput={params => (
                                                    <TextField {...params} label="Primary network*" />
                                                )}
                                                clearIcon={false}
                                            //disabled={editMode}
                                            />
                                        </div>
                                        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl">
                                            <Autocomplete
                                                className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                options={subNetworkList}
                                                value={subNetworkSelected}
                                                onChange={(_event, val) => handleSubNetwork(val)}
                                                renderInput={params => (
                                                    <TextField {...params} label="Sub network*" />
                                                )}
                                                clearIcon={false}
                                            //disabled={editMode}
                                            />
                                        </div>
                                    </div>
                                </> :
                                <>
                                    {/* Network shared from host project */}
                                    <div className="create-scheduler-form-element">
                                        <Autocomplete
                                            className="create-scheduler-style"
                                            options={sharedNetworkList}
                                            value={sharedNetworkSelected}
                                            onChange={(_event, val) => handleSharedNetwork(val)}
                                            renderInput={params => (
                                                <TextField {...params} label="Shared subnetwork*" />
                                            )}
                                            clearIcon={false}
                                        //disabled={editMode}
                                        />
                                    </div>
                                </>
                        }

                        <div className="create-scheduler-form-element">
                            <Input
                                className="create-scheduler-style"
                                value={networkTags}
                                onChange={e => handleNetworkTags(e)}
                                type="text"
                                placeholder=""
                                Label="Network tags"
                            //disabled={editMode}
                            />
                        </div>
                        <span className="tab-description tab-text-sub-cl">Network tabs are text attributes you can add to make firewall rules and routes applicable to specify VM instances</span>

                        {/* <Scheduler /> */}
                        <div className="create-scheduler-label">Schedule</div>
                        <div className="create-scheduler-form-element">
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="demo-controlled-radio-buttons-group"
                                    name="controlled-radio-buttons-group"
                                    value={scheduleMode}
                                    onChange={handleSchedulerModeChange}
                                >
                                    <FormControlLabel
                                        value="runNow"
                                        className="create-scheduler-label-style"
                                        control={<Radio size="small" />}
                                        label={
                                            <Typography sx={{ fontSize: 13 }}>Run now</Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value="runSchedule"
                                        className="create-scheduler-label-style"
                                        control={<Radio size="small" />}
                                        label={
                                            <Typography sx={{ fontSize: 13 }}>
                                                Run on a schedule
                                            </Typography>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>
                        </div>
                        <div className="schedule-child-section">
                            {
                                scheduleMode === 'runSchedule' &&
                                <div className="create-scheduler-radio-element">
                                    <FormControl>
                                        <RadioGroup
                                            aria-labelledby="demo-controlled-radio-buttons-group"
                                            name="controlled-radio-buttons-group"
                                            value={internalScheduleMode}
                                            onChange={handleInternalSchedulerModeChange}
                                        >
                                            <FormControlLabel
                                                value="cronFormat"
                                                className="create-scheduler-label-style"
                                                control={<Radio size="small" />}
                                                label={
                                                    <Typography sx={{ fontSize: 13 }}>Use UNIX cron format</Typography>
                                                }
                                            />
                                            <FormControlLabel
                                                value="userFriendly"
                                                className="create-scheduler-label-style"
                                                control={<Radio size="small" />}
                                                label={
                                                    <Typography sx={{ fontSize: 13 }}>
                                                        Use user-friendly scheduler
                                                    </Typography>
                                                }
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </div>
                            }
                            {
                                scheduleMode === 'runSchedule' &&
                                <div className="execution-history-main-wrapper">
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                                            <DateTimePicker
                                                className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                label="Start Date"
                                                value={startDate}
                                                onChange={(newValue) => handleStartDate(newValue)}
                                                slots={{
                                                    openPickerIcon: CalendarMonthIcon
                                                }}
                                                slotProps={{
                                                    actionBar: {
                                                        actions: ['clear']
                                                    },
                                                    tabs: {
                                                        hidden: true,
                                                    },
                                                }}
                                                disablePast
                                                closeOnSelect={true}
                                            />
                                        </div>
                                        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                                            <DateTimePicker
                                                className="create-scheduler-style create-scheduler-form-element-input-fl"
                                                label="End Date"
                                                value={endDate}
                                                onChange={(newValue) => handleEndDate(newValue)}
                                                slots={{
                                                    openPickerIcon: CalendarMonthIcon
                                                }}
                                                slotProps={{
                                                    actionBar: {
                                                        actions: ['clear']
                                                    },
                                                    field: { clearable: true },
                                                    tabs: {
                                                        hidden: true,
                                                    },
                                                }}
                                                disablePast
                                                closeOnSelect={true}
                                            />
                                        </div>
                                    </LocalizationProvider>
                                </div>
                            }
                            {
                                endDateError &&
                                <div className="error-key-time">
                                    <iconError.react tag="div" className="logo-alignment-style" />
                                    <div className="error-key-missing">End date should be greater than Start date</div>
                                </div>
                            }
                            {
                                scheduleMode === 'runSchedule' && internalScheduleMode === 'cronFormat' &&
                                <div className="create-scheduler-form-element schedule-input-field">
                                    <Input
                                        className="create-scheduler-style"
                                        value={scheduleField}
                                        onChange={e => handleSchedule(e)}
                                        type="text"
                                        placeholder=""
                                        Label="Schedule*"
                                    />
                                    <span className="tab-description tab-text-sub-cl">Schedule is specified using unix-cron format. You can define a schedule so that your execution runs multiple times a day, or runs on specific days and months.</span>
                                </div>
                            }
                            {scheduleMode === 'runSchedule' && internalScheduleMode === 'userFriendly' && (
                                <div className="create-scheduler-form-element">
                                    <Cron value={scheduleValue} setValue={setScheduleValue} />
                                </div>
                            )}
                            {
                                scheduleMode === 'runSchedule' &&
                                <>
                                    <div className="create-scheduler-form-element">
                                        <Autocomplete
                                            className="create-scheduler-style"
                                            options={timezones}
                                            value={timeZoneSelected}
                                            onChange={(_event, val) => handleTimeZoneSelected(val)}
                                            renderInput={params => (
                                                <TextField {...params} label="Time Zone*" />
                                            )}
                                            clearIcon={false}
                                        />
                                    </div>
                                    <div className="create-scheduler-form-element">
                                        <Input
                                            className="create-scheduler-style"
                                            value={maxRuns}
                                            onChange={e => handleMaxRuns(e)}
                                            type="number"
                                            placeholder=""
                                            Label="Max runs"
                                        // disabled={scheduleMode === 'runNow'}
                                        />
                                    </div>
                                </>

                            }
                        </div>
                        <div className="save-overlay">
                            <Button
                                onClick={
                                    () => {
                                        if (!isSaveDisabled()) {
                                            handleCreateJobScheduler()
                                        }
                                    }
                                }
                                variant="contained"
                                disabled={isSaveDisabled()}
                                aria-label={editMode ? ' Update Schedule' : 'Create Schedule'}
                            >
                                <div>
                                    {editMode
                                        ? creatingVertexScheduler
                                            ? 'UPDATING'
                                            : 'UPDATE'
                                        : creatingVertexScheduler
                                            ? 'CREATING'
                                            : 'CREATE'}
                                </div>
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={creatingVertexScheduler}
                                aria-label="cancel Batch"
                                onClick={!creatingVertexScheduler ? handleCancel : undefined}
                            >
                                <div>CANCEL</div>
                            </Button>
                        </div>

                    </div>
            }

        </>

    );
};

export default CreateVertexScheduler;
