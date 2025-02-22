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
import { toast } from "react-toastify";
import { requestAPI } from "../handler/handler";
import { DataprocLoggingService, LOG_LEVEL } from "../utils/loggingService";
import { toastifyCustomStyle } from "../utils/utils";

export class IamServices {

    static serviceAccountAPIService = async (
        setServiceAccountList: (
            value: { displayName: string; email: string }[]
        ) => void,
        setServiceAccountLoading: (value: boolean) => void
    ) => {
        try {
            setServiceAccountLoading(true)
            const formattedResponse: any = await requestAPI(`api/iam/listServiceAccount`);
            if (formattedResponse.length > 0) {
                const serviceAccountList = formattedResponse.map((account: any) => ({
                    displayName: account.displayName,
                    email: account.email
                }));
                serviceAccountList.sort();
                setServiceAccountList(serviceAccountList);
            } else {
                setServiceAccountList([])
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
}