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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickersDayProps, PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs, { Dayjs } from 'dayjs';
// import ListDagRuns from '../listDagRuns';
import { LabIcon } from '@jupyterlab/ui-components';
import LeftArrowIcon from '../../../style/icons/left_arrow_icon.svg';
import { Box, LinearProgress } from '@mui/material';
import { authApi, handleDebounce } from '../../utils/utils';
import VertexJobRuns from './VertexJobRuns';
import VertexJobTaskLogs from './VertexJobTaskLogs';
// import { handleDebounce } from '../utils/utils';

const iconLeftArrow = new LabIcon({
    name: 'launcher:left-arrow-icon',
    svgstr: LeftArrowIcon
});

const VertexExecutionHistory = ({
    region,
    setRegion,
    schedulerData,
    scheduleName,
    handleBackButton,
    bucketName,
    setExecutionPageFlag
}: {
    region: string;
    setRegion: (value: string) => void;
    schedulerData: string;
    scheduleName: string;
    handleBackButton: () => void;
    bucketName: string;
    setExecutionPageFlag: (value: boolean) => void;
}): JSX.Element => {

    const today = dayjs()

    const [dagRunId, setDagRunId] = useState('');
    // const [region, setRegion] = useState('')
    const currentDate = new Date().toLocaleDateString();
    const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    // const [startDate, setStartDate] = useState('');
    // const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [blueListDates, setBlueListDates] = useState<string[]>([]);
    const [greyListDates, setGreyListDates] = useState<string[]>([]);
    const [orangeListDates, setOrangeListDates] = useState<string[]>([]);
    const [redListDates, setRedListDates] = useState<string[]>([]);
    const [greenListDates, setGreenListDates] = useState<string[]>([]);
    const [darkGreenListDates, setDarkGreenListDates] = useState<string[]>([]);

    const [height, setHeight] = useState(window.innerHeight - 145);

    function handleUpdateHeight() {
        let updateHeight = window.innerHeight - 145;
        setHeight(updateHeight);
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

    useEffect(() => {
        authApi()
            .then((credentials) => {
                if (credentials && credentials?.region_id && credentials.project_id) {
                    setRegion(credentials.region_id);
                }
            })
            .catch((error) => {
                console.error(error);
            });
        setSelectedMonth(dayjs(currentDate));
        setSelectedDate(dayjs(currentDate));
        setExecutionPageFlag(false);
    }, []);

    const handleDateSelection = (selectedValue: any) => {
        setDagRunId('');
        setSelectedDate(selectedValue);
    };

    const handleMonthChange = (newMonth: any) => {
        // Check if the new month is different from the current month
        if (newMonth.month() !== today.month()) {
            // Reset selected date if the month changes
            setSelectedDate(null);
        } else {
            // Keep the selected date unchanged if we're still in the current month
            setSelectedDate(today);
        }
        setSelectedMonth(newMonth)
        // console.log('New month selected:', newMonth);
        // console.log('Previous month value:', newMonth.subtract(1, 'month').format('MMMM YYYY'));
    };

    // const CustomDay = (props: PickersDayProps<Dayjs>) => {
    //     // const { day, isFirstVisibleCell, isLastVisibleCell } = props;
    //     const { day } = props;
    //     // if (isFirstVisibleCell) {
    //     //     // setStartDate(new Date(day.toDate()).toISOString());
    //     // }
    //     // if (isLastVisibleCell) {
    //     //     const nextDate = new Date(day.toDate());
    //     //     nextDate.setDate(day.toDate().getDate() + 1);
    //     //     // setEndDate(nextDate.toISOString());
    //     // }

    //     const totalViewDates = day.date();
    //     // const formatDate = (date: Dayjs) => date.format('YYYY-MM-DD');
    //     const formattedTotalViewDate = totalViewDates.toString().padStart(2, '0');

    //     //Color codes to highlight dates in calendar
    //     //Blue color code for running status
    //     const isBlueExecution =
    //         blueListDates.length > 0 &&
    //         blueListDates.includes(formattedTotalViewDate);
    //     //Grey color code for queued status
    //     const isGreyExecution =
    //         greyListDates.length > 0 &&
    //         greyListDates.includes(formattedTotalViewDate);
    //     //Orange color code for combination of failed and success status
    //     const isOrangeExecution =
    //         orangeListDates.length > 0 &&
    //         orangeListDates.includes(formattedTotalViewDate);
    //     //Red color code for only with failed status
    //     const isRedExecution =
    //         redListDates.length > 0 && redListDates.includes(formattedTotalViewDate);
    //     //Green color code for only one with success status
    //     const isGreenExecution =
    //         greenListDates.length > 0 &&
    //         greenListDates.includes(formattedTotalViewDate);
    //     //Green color code for multiple success status
    //     const isDarkGreenExecution =
    //         darkGreenListDates.length > 0 &&
    //         darkGreenListDates.includes(formattedTotalViewDate);

    //     const isSelectedExecution =
    //         [selectedDate?.date()].includes(totalViewDates) &&
    //         selectedDate?.month() === day?.month();
    //     const currentDataExecution =
    //         [dayjs(currentDate)?.date()].includes(totalViewDates) &&
    //         [dayjs(currentDate)?.month()].includes(day.month());

    //     return (
    //         <PickersDay
    //             {...props}
    //             style={{
    //                 border: 'none',
    //                 borderRadius:
    //                     isSelectedExecution ||
    //                         isDarkGreenExecution ||
    //                         isGreenExecution ||
    //                         isRedExecution ||
    //                         isOrangeExecution ||
    //                         isGreyExecution ||
    //                         isBlueExecution
    //                         ? '50%'
    //                         : 'none',
    //                 backgroundColor: isSelectedExecution
    //                     ? '#3B78E7'
    //                     : isDarkGreenExecution
    //                         ? '#1E6631'
    //                         : isGreenExecution
    //                             ? '#34A853'
    //                             : isOrangeExecution
    //                                 ? '#FFA52C'
    //                                 : isRedExecution
    //                                     ? '#EA3323'
    //                                     : isBlueExecution
    //                                         ? '#00BFA5'
    //                                         : isGreyExecution
    //                                             ? '#AEAEAE'
    //                                             : 'transparent',
    //                 color:
    //                     isSelectedExecution ||
    //                         isDarkGreenExecution ||
    //                         isGreenExecution ||
    //                         isRedExecution ||
    //                         isOrangeExecution ||
    //                         isGreyExecution ||
    //                         isBlueExecution
    //                         ? 'white'
    //                         : currentDataExecution
    //                             ? '#3367D6'
    //                             : 'inherit'
    //             }}
    //         />
    //     );
    // };

    const getFormattedDate = (dateList: any[], day: string | number | Date | dayjs.Dayjs | null | undefined) => {

        const formattedDay = dayjs(day).format('YYYY-MM-DD');
        const date_list = dateList.map(dateStr => new Date(dateStr).toISOString().split('T')[0]).includes(formattedDay);
        return date_list
    }
    const CustomDay = (props: PickersDayProps<Dayjs>) => {
        const { day } = props;

        // const blueListDates = ['2024-12-15'];
        // const greyListDates = ['2024-12-14', '2024-12-12'];
        // const orangeListDates = ['2024-12-09'];
        // const redListDates: string | string[] = [];
        // const greenListDates: string | string[] = [];
        // const darkGreenListDates: string | string[] = [];

        // Format day into a string that matches the date strings in the lists
        // const formattedDay = dayjs(day).format('YYYY-MM-DD');
        const isSelectedExecution = selectedDate ? selectedDate.date() === day.date() && selectedDate.month() === day.month() : false;

        // Check if the date matches the respective statuses
        const isBlueExecution = getFormattedDate(blueListDates, day)
        const isGreyExecution = getFormattedDate(greyListDates, day);
        const isOrangeExecution = getFormattedDate(orangeListDates, day);
        const isRedExecution = getFormattedDate(redListDates, day);
        const isGreenExecution = getFormattedDate(greenListDates, day);
        const isDarkGreenExecution = getFormattedDate(darkGreenListDates, day);

        // const isSelectedExecution = [dayjs().date()].includes(day.date());

        return (
            <PickersDay
                {...props}
                style={{
                    border: 'none',
                    borderRadius:
                        isSelectedExecution ||
                            isDarkGreenExecution ||
                            isGreenExecution ||
                            isRedExecution ||
                            isOrangeExecution ||
                            isGreyExecution ||
                            isBlueExecution
                            ? '50%'
                            : 'none',
                    backgroundColor: isSelectedExecution
                        ? '#3B78E7'
                        : isDarkGreenExecution
                            ? '#1E6631'
                            : isGreenExecution
                                ? '#34A853'
                                : isOrangeExecution
                                    ? '#FFA52C'
                                    : isRedExecution
                                        ? '#EA3323'
                                        : isBlueExecution
                                            ? '#00BFA5'
                                            : isGreyExecution
                                                ? '#AEAEAE'
                                                : 'transparent',
                    color:
                        isSelectedExecution ||
                            isDarkGreenExecution ||
                            isGreenExecution ||
                            isRedExecution ||
                            isOrangeExecution ||
                            isGreyExecution ||
                            isBlueExecution
                            ? 'white'
                            : 'inherit',
                }}
            />
        );
    };

    return (
        <>
            <>
                <div className="execution-history-header">
                    <div
                        role="button"
                        className="scheduler-back-arrow-icon"
                        onClick={() => handleBackButton()}
                    >
                        <iconLeftArrow.react
                            tag="div"
                            className="icon-white logo-alignment-style"
                        />
                    </div>
                    <div className="create-job-scheduler-title">
                        Execution History: {scheduleName}
                    </div>
                </div>
                <div
                    className="execution-history-main-wrapper"
                    style={{ height: height }}
                >
                    <div className="execution-history-left-wrapper">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            {isLoading ? (
                                <div className="spin-loader-main-calender">
                                    <Box sx={{ width: '100%' }}>
                                        <LinearProgress />
                                    </Box>
                                </div>
                            ) : (
                                <div
                                    className="spin-loader-main-calender"
                                    style={{ height: '4px' }}
                                ></div>
                            )}
                            <DateCalendar
                                minDate={dayjs().year(2024).startOf('year')}
                                maxDate={dayjs(currentDate)}
                                // referenceDate={dayjs(currentDate)}
                                defaultValue={today}
                                onChange={newValue => handleDateSelection(newValue)}
                                onMonthChange={handleMonthChange}
                                slots={{
                                    day: CustomDay
                                }}
                            />
                        </LocalizationProvider>
                        {/* {startDate !== '' && endDate !== '' && ( */}
                        <VertexJobRuns
                            region={region}
                            schedulerData={schedulerData}
                            dagId={scheduleName}
                            // startDate={startDate}
                            // endDate={endDate}
                            setDagRunId={setDagRunId}
                            selectedMonth={selectedMonth}
                            selectedDate={selectedDate}
                            setBlueListDates={setBlueListDates}
                            setGreyListDates={setGreyListDates}
                            setOrangeListDates={setOrangeListDates}
                            setRedListDates={setRedListDates}
                            setGreenListDates={setGreenListDates}
                            setDarkGreenListDates={setDarkGreenListDates}
                            bucketName={bucketName}
                            setIsLoading={setIsLoading}
                            isLoading={isLoading}
                        />
                        {/* )} */}
                    </div>
                    <div className="execution-history-right-wrapper">
                        {dagRunId !== '' && (
                            <VertexJobTaskLogs
                                composerName={schedulerData}
                                dagId={scheduleName}
                                dagRunId={dagRunId}
                            />
                        )}
                    </div>
                </div>
            </>
        </>
    );
};

export default VertexExecutionHistory;
