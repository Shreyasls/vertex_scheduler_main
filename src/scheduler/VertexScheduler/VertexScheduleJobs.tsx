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

import React from 'react';
import { DataprocWidget } from '../../controls/DataprocWidget';
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import ListVertexScheduler from '../VertexScheduler/ListVertexScheduler';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

const VertexScheduleJobs = ({
    app,
    settingRegistry,
    region,
    setRegion,
}: {
    app: JupyterLab;
    themeManager: IThemeManager;
    settingRegistry: ISettingRegistry;
    region: string;
    setRegion: (value: string) => void;
}): React.JSX.Element => {

    return (
        <>
            <div>
                <ListVertexScheduler
                    region={region}
                    setRegion={setRegion}
                    app={app}
                    settingRegistry={settingRegistry}
                />
            </div>
        </>
    );
};

export class NotebookJobs extends DataprocWidget {
    app: JupyterLab;
    settingRegistry: ISettingRegistry;
    setExecutionPageFlag: (value: boolean) => void;

    constructor(
        app: JupyterLab,
        settingRegistry: ISettingRegistry,
        themeManager: IThemeManager,
        setExecutionPageFlag: (value: boolean) => void
    ) {
        super(themeManager);
        this.app = app;
        this.settingRegistry = settingRegistry;
        this.setExecutionPageFlag = setExecutionPageFlag
    }
    renderInternal(): React.JSX.Element {
        return (
            <VertexScheduleJobs
                app={this.app}
                settingRegistry={this.settingRegistry}
                themeManager={this.themeManager}
                region={''} 
                setRegion={function (value: string): void {
                    throw new Error('Function not implemented.');
                }} />
        );
    }
}

export default VertexScheduleJobs;
