# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from dataproc_jupyter_plugin.commons.constants import (
    CONTENT_TYPE,
)


class Client:
    def __init__(self, credentials, log, client_session):
        self.log = log
        if not (
            ("access_token" in credentials)
            and ("project_id" in credentials)
            and ("region_id" in credentials)
        ):
            self.log.exception("Missing required credentials")
            raise ValueError("Missing required credentials")
        self._access_token = credentials["access_token"]
        self.project_id = credentials["project_id"]
        self.region_id = credentials["region_id"]
        self.client_session = client_session

    def create_headers(self):
        return {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {self._access_token}",
        }

    async def list_uiconfig(self, region_id):
        try:
            uiconfig = []
            api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/ui/projects/{self.project_id}/locations/{region_id}/uiConfig"

            headers = self.create_headers()
            async with self.client_session.get(
                api_endpoint, headers=headers
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    if not resp:
                        return uiconfig
                    else:
                        for machineconfig in resp.get("notebookRuntimeConfig").get(
                            "machineConfigs"
                        ):
                            ramBytes_in_gb = round(
                                int(machineconfig.get("ramBytes")) / 1000000000, 2
                            )
                            formatted_config = {
                                "machineType": f"{machineconfig.get('machineType')} ({machineconfig.get('cpuCount')} CPUs, {ramBytes_in_gb} GB RAM)",
                                "acceleratorConfigs": machineconfig.get(
                                    "acceleratorConfigs"
                                ),
                            }
                            uiconfig.append(formatted_config)
                        return uiconfig
                else:
                    self.log.exception("Error listing ui config")
                    raise Exception(
                        f"Error getting vertex ui config: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error fetching ui config: {str(e)}")
            return {"Error fetching ui config": str(e)}
