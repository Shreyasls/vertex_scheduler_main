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

import { test, expect, galata } from '@jupyterlab/galata';

// Set a common timeout for all tests
const timeout = 5 * 60 * 1000;

// Function to navigate to Scheduled Jobs listing page
async function navigateToScheduleJobsListingPage(page) {
  await page.locator('//*[@data-category="Google Cloud Resources" and @title="Scheduled Jobs"]').click();
  await page.getByText('Loading Vertex Schedules').waitFor({ state: "detached" });
}

/**
* Helper function to check if an input field is not empty.
* @param {Object} page - Playwright page object.
* @param {string} label - Label of the input field.
*/
async function checkInputNotEmpty(page, label) {
  const input = page.getByLabel(label);
  const value = await input.inputValue();
  return value.trim() !== '';
}

async function checkInputFieldsNotEmpty(page) {
  // Validate that all input fields are not empty
  const jobNameNotEmpty = await checkInputNotEmpty(page, 'Job name*');
  const regionNotEmpty = await checkInputNotEmpty(page, 'Region*');
  const MachinetypeNotEmpty = await checkInputNotEmpty(page, 'Machine type*');
  const AcceleratortypeNotEmpty = await checkInputNotEmpty(page, 'Accelerator type*');
  const AcceleratorcountNotEmpty = await checkInputNotEmpty(page, 'Accelerator count*');
  const KernelNotEmpty = await checkInputNotEmpty(page, 'Kernel*');
  const CloudStorageBucketNotEmpty = await checkInputNotEmpty(page, 'Cloud Storage Bucket*');
  const DisktypeNotEmpty = await checkInputNotEmpty(page, 'Disk Type');
  const DisksizeNotEmpty = await checkInputNotEmpty(page, 'Disk Size (in GB)');
  const ServiceAccountNotEmpty = await checkInputNotEmpty(page, 'Service account*');
  const PrimaryNetworkNotEmpty = await checkInputNotEmpty(page, 'Primary network');
  const SubNetworkNotEmpty = await checkInputNotEmpty(page, 'Sub network');

  const allFieldsFilled =
    jobNameNotEmpty &&
    regionNotEmpty &&
    MachinetypeNotEmpty &&
    AcceleratortypeNotEmpty &&
    AcceleratorcountNotEmpty &&
    KernelNotEmpty &&
    CloudStorageBucketNotEmpty &&
    DisktypeNotEmpty &&
    DisksizeNotEmpty &&
    ServiceAccountNotEmpty &&
    PrimaryNetworkNotEmpty &&
    SubNetworkNotEmpty;

  return allFieldsFilled;

}

test.describe('Vertex scheduling jobs', () => {
  test.skip('Can create job scheduler', async ({ page }) => {
    test.setTimeout(150 * 1000);
    let clusterNotEmpty = true;

    // Navigate to the notebook content region
    await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    const locator = page.locator('.jp-LauncherCard:visible', {
      hasText: 'Python 3 (ipykernel) (Local)'
    });

    const count = await locator.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await locator.first().click();
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      // Fill in the required fields in the Job Scheduler form
      await page.getByLabel('Job name*').click();
      await page.getByLabel('Job name*').fill('test_23dec_t6');

      await page.getByLabel('Disk Size (in GB)').click();
      await page.getByLabel('Disk Size (in GB)').fill('50');

      // Select the first available option for dropdown fields
      const dropdownFields = [
        'Machine type*',
        'Accelerator type*',
        'Accelerator count*',
        'Kernel*',
        'Cloud Storage Bucket*',
        'Disk Type',
        'Primary network',
        'Sub network',
      ];

      for (const label of dropdownFields) {
        await page.getByLabel(label).click();
        await page.getByRole('option').first().click();
      }

      const inputfields = await checkInputFieldsNotEmpty(page);

      if (!inputfields) {
        await expect(page.getByLabel('Create Schedule')).toBeDisabled();
      } else {
        await expect(
          page.getByLabel('Create Schedule')
        ).not.toBeDisabled();
        await page.getByLabel('Create Schedule').click();
      }

    }
  });

  /**
  * Helper function to validate field error visibility and resolution.
  * @param {Object} page - Playwright page object.
  * @param {string} fieldLabel - Label of the field to validate.
  * @param {string} errorMessage - Error message to check visibility.
  * @param {boolean} isDropdown - Whether the field is a dropdown (default: false).
  * @param {string} [dropdownOption] - Option to select if field is a dropdown.
  */
  async function validateErrorResolution(page, fieldLabel, errorMessage, isDropdown = false, dropdownOption = '') {
    // Ensure the error message is visible
    await expect(page.getByText(errorMessage)).toBeVisible();

    // Interact with the field based on its type
    const field = page.getByLabel(fieldLabel);
    if (isDropdown) {
      await field.click();
      if (dropdownOption) {
        await page.getByRole('option', { name: dropdownOption }).click();
      } else {
        await page.getByRole('option').first().click();
      }
    } else {
      await field.click();
      await field.fill('test_value'); // Fill with a placeholder value
    }

    // Verify the error message is no longer visible
    await expect(page.getByText(errorMessage)).toBeHidden();
  }

  test('Sanity: can perform field validation', async ({ page }) => {
    test.setTimeout(150 * 1000);

    // Navigate to the notebook content
    await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    const kernelCard = page.locator('.jp-LauncherCard:visible', {
      hasText: 'Python 3 (ipykernel) (Local)',
    });
    const kernelCount = await kernelCard.count();
    expect(kernelCount).toBeGreaterThan(0);

    if (kernelCount > 0) {
      await kernelCard.first().click();

      // Step 3: Open Job Scheduler dialog
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      // Validate all errors and resolve them
      const fieldsToValidate = [
        { label: 'Job name*', error: 'Name is required', isDropdown: false },
        { label: 'Region*', error: 'Region is required', isDropdown: true, dropdownOption: 'us-central1' },
        { label: 'Machine type*', error: 'Machine type is required', isDropdown: true },
        { label: 'Accelerator type*', error: 'Accelerator type is required', isDropdown: true },
        { label: 'Accelerator count*', error: 'Accelerator count is required', isDropdown: true },
        { label: 'Kernel*', error: 'Kernel is required', isDropdown: true },
        { label: 'Cloud Storage Bucket*', error: 'Cloud storage bucket is required', isDropdown: true },
        { label: 'Primary network', error: 'Primary network is required', isDropdown: true },
        { label: 'Sub network', error: 'Sub network is required', isDropdown: true },
      ];

      for (const field of fieldsToValidate) {
        await validateErrorResolution(page, field.label, field.error, field.isDropdown, field.dropdownOption);
      }

      // Add a parameter and validate
      await page.getByRole('button', { name: 'ADD PARAMETER' }).click();
      await expect(page.getByText('key is required')).toBeVisible();
      await page.getByLabel('Key 1*').fill('key1');
      await expect(page.getByText('key is required')).toBeHidden();

      // Schedule configuration
      await page.getByLabel('Run on a schedule').click();
      await expect(page.locator('div').filter({ hasText: /^Start Date$/ }).getByPlaceholder('MM/DD/YYYY hh:mm aa')).toBeVisible();
      await expect(page.locator('div').filter({ hasText: /^End Date$/ }).getByPlaceholder('MM/DD/YYYY hh:mm aa')).toBeVisible();
      await expect(page.getByLabel('Schedule*')).toBeVisible();
      await expect(page.getByText('Schedule field is required')).toBeVisible();
      await expect(page.getByLabel('Time Zone*')).toBeVisible();
      await expect(page.getByLabel('Time Zone*')).not.toBeEmpty();
      await expect(page.getByLabel('Max runs')).toBeVisible();
    }
  });
});

// Function to get the first job that has a specific action enabled
async function getJobWithAction(page, action) {
  // Check list of jobs are displayed
  const tableLocator = page.locator('//table[@class="clusters-list-table"]');
  if (await tableLocator.isVisible()) {
    const jobRows = page.locator('//tr[@class="cluster-list-data-parent"]');
    const noOfJobs = await jobRows.count();

    for (let i = 0; i < noOfJobs; i++) {
      const actionIcon = jobRows.nth(i).locator(`//div[@title="${action}"]`);
      if (await actionIcon.isVisible() && await actionIcon.isEnabled()) {
        return jobRows.nth(i);
      }
    }
    return null;
  } else {
    await expect(page.getByText('No rows to display')).toBeVisible();
    return null;
  }
}

test.describe('Vertex scheduling jobs listing page validation', () => {
  test('Sanity: Can verify content on the listing page', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    // Validate fields and behavior
    await expect(page.getByLabel('Vertex')).toBeVisible();
    await expect(page.getByLabel('Vertex')).toBeChecked();
    await expect(page.getByLabel('Composer')).toBeVisible();
    await expect(page.getByLabel('Composer')).not.toBeChecked();

    const regionField = page.getByLabel('Region*');
    await expect(regionField).toBeVisible();
    await regionField.clear();
    await expect(page.getByText('Region is required')).toBeVisible();
    await regionField.click();
    await page.getByRole('option', { name: 'us-central1' }).click();
    await expect(page.getByText('Region is required')).toBeHidden();
    await expect(page.getByLabel('cancel Batch')).toBeVisible();

    // Check list of jobs are displayed
    const tableExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
    if (tableExists) {
      // Check job table headers if table data is present
      const headers = [
        'Job Name', 'Schedule', 'Status', 'Actions'
      ];
      for (const header of headers) {
        await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }

      const rowCount = await page.locator('//table[@class="clusters-list-table"]//tr').count();
      expect(rowCount).toBeGreaterThan(0);
    }
    else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('Check if job is active or completed or paused', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    // Check the job status
    const tableExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
    if (tableExists) {
      const parentLocator = page.locator('//tr[@class="cluster-list-data-parent"]');
      const noOfRows = await parentLocator.count();
      for (let i = 0; i < noOfRows; i++) {
        const status = await parentLocator.nth(i).locator('//td[@role="cell"][3]').innerText();

        //check status column text
        expect(['ACTIVE', 'COMPLETED', 'PAUSED']).toContainEqual(status);
        break;
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('Check if the job is created to run once or on a schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const parentLocator = page.locator('//tr[@class="cluster-list-data-parent"]');
    const noOfClusters = await parentLocator.count();
    for (let i = 0; i < noOfClusters; i++) {
      const schedulecol = await parentLocator.nth(i).locator('//td[@role="cell"][2]').innerText();
      //check schedule column text
      await ScheduleText(schedulecol);
      break;
    }
    //check schedule column text
    async function ScheduleText(schedulecol) {
      if (schedulecol == 'Run Once') {
        console.log('job is created for ' + schedulecol);
      }
      else {
        console.log('job is created for ' + schedulecol);
      }
    }
  });

  test('Can edit a notebook', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    const jobLocator = await getJobWithAction(page, "Edit Notebook");

    if (jobLocator) {
      await expect(jobLocator.locator('//div[@title="Edit Notebook"]')).toBeEnabled();
      await jobLocator.locator('//div[@title="Edit Notebook"]').click();
      await page.getByRole('progressbar').waitFor({ state: "detached" });
      await expect(page).toHaveTitle(/ipynb/);
      await page.pause();
    }

  });

  test('Sanity: Pause a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, "Pause");
    if (jobLocator) {
      const jobName = await jobLocator.locator('//td[@role="cell"][1]').innerText();
      console.log(`Pausing job: ${jobName}`);
      const msg = 'Schedule ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Pause"]').click();
      await page.getByRole('progressbar').waitFor({ state: "detached" });
      await jobLocator.getByText('ACTIVE').waitFor({ state: "detached" });
      await expect(jobLocator.getByText('PAUSED')).toBeVisible();
      await expect(page.locator('(//div[@role="alert"and @class="Toastify__toast-body"])[1]')).toContainText(msg);
    } else {
      console.log("No job available to pause.");
    }
  });

  // Test to handle the "Resume" action
  test('Resume a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, "Resume");
    if (jobLocator) {
      const jobName = await jobLocator.locator('//td[@role="cell"][1]').innerText();
      console.log(`Resuming job: ${jobName}`);
      const msg = 'Schedule ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Resume"]').click();
      await page.getByRole('progressbar').waitFor({ state: "detached" });
      await jobLocator.getByText('PAUSED').waitFor({ state: "detached" });
      await expect(jobLocator.getByText('ACTIVE')).toBeVisible();
      await expect(page.locator('(//div[@role="alert"and @class="Toastify__toast-body"])[1]')).toContainText(msg);
    } else {
      console.log("No job available to resume.");
    }
  });

  // Test to handle the "Trigger" action
  test('Trigger a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, "Trigger the job");
    if (jobLocator) {
      const jobName = await jobLocator.locator('//td[@role="cell"][1]').innerText();
      const triggerMessage = `${jobName} triggered successfully`;
      console.log(`Triggering job: ${jobName}`);

      await jobLocator.locator('//div[@title="Trigger the job"]').click();
      await page.getByRole('progressbar').waitFor({ state: "detached" });
      await expect(page.locator('(//div[@role="alert" and @class="Toastify__toast-body"])[1]')).toContainText(triggerMessage);
    } else {
      console.log("No job available to trigger.");
    }
  });

  // Test to handle "Edit Schedule" function
  test('Edit a schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    const jobLocator = await getJobWithAction(page, "Edit Schedule");

    if (jobLocator) {
      const jobName = await jobLocator.locator('//td[@role="cell"][1]').innerText();
      const msg = 'Job ' + jobName + ' successfully updated';

      await jobLocator.locator('//div[@title="Edit Schedule"]').click();
      await page.getByRole('progressbar').waitFor({ state: "detached" });

      // update disk size
      await page.getByLabel('Disk Size (in GB)').clear();
      await page.getByLabel('Disk Size (in GB)').fill('200');

      // Validate that input fields are not empty
      const inputfields = await checkInputFieldsNotEmpty(page);
      const StartDateNotEmpty = await page.locator('div').filter({ hasText: /^Start Date$/ }).getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const EndDateNotEmpty = await page.locator('div').filter({ hasText: /^End Date$/ }).getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const ScheduleNotEmpty = await checkInputNotEmpty(page, 'Schedule*');
      const TimeZoneNotEmpty = await checkInputNotEmpty(page, 'Time Zone*');

      const scheduleFieldsFilled =
        StartDateNotEmpty &&
        EndDateNotEmpty &&
        ScheduleNotEmpty &&
        TimeZoneNotEmpty;

      // click update
      if (!scheduleFieldsFilled && !inputfields) {
        await expect(page.getByLabel(' Update Schedule')).toBeDisabled();
      } else {
        await expect(
          page.getByLabel(' Update Schedule')
        ).not.toBeDisabled();
        await page.getByLabel(' Update Schedule').click();
      }
      // verify schedule updated
      await expect(page.locator('(//div[@role="alert"and @class="Toastify__toast-body"])[1]')).toContainText(msg);

    } else {
      console.log("No job available to delete.");
    }
  });

  // Test to handle the "Delete" action
  test('Sanity: Delete a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, "Delete");
    if (jobLocator) {
      const jobName = await jobLocator.locator('//td[@role="cell"][1]').innerText();
      console.log(`Deleting job: ${jobName}`);

      await jobLocator.locator('//div[@title="Delete"]').click();
      await expect(page.getByText(`This will delete ${jobName} and cannot be undone.`)).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();
      await page.waitForTimeout(5000);
      await expect(page.getByText(`Deleted job ${jobName}. It might take a few minutes to for it to be deleted from the list of jobs.`)).toBeVisible();
    } else {
      console.log("No job available to delete.");
    }
  });
});

// Helper to navigate to the Execution History page for the first job
async function navigateToExecutionHistory(page) {
  const jobName = await page.getByRole('cell').first().innerText();
  await page.getByRole('cell').first().click();
  await page.getByText('Loading History').waitFor({ state: "detached" });
  await page.getByText('Loading Dag Runs Task Instances').waitFor({ state: "detached" });
  return jobName;
}

test.describe('Vertex scheduling jobs execution history', () => {
  test('Sanity: can verify execution history page', async ({ page }) => {
    test.setTimeout(150 * 1000);

    await navigateToScheduleJobsListingPage(page);

    const listingTableExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
    if (listingTableExists) {

      const jobName = await navigateToExecutionHistory(page);

      // Verify job name is displayed
      await expect(page.getByText('Execution History: ' + jobName)).toBeVisible();

      // Check table headers if table data is present
      const historyDataExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
      if (historyDataExists) {
        const headers = [
          'State', 'Date', 'Time', 'Actions',
        ];
        for (const header of headers) {
          await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
        }

        const requiredFields = ["Severity", "Time Stamp", "Summary"];

        for (const field of requiredFields) {
          await expect(page.locator(`//div[@class="accordion-vertex-row-data" and text()="${field}"]`)).toBeVisible();
        }

        const rowCount = await page.locator('//div[@class="accordion-vertex-row-parent"]').count();
        expect(rowCount).toBeGreaterThan(1);

      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
      }
    }
    else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }

  });

  test.skip('Can download output from execution history page', async ({ page }) => {
    test.setTimeout(150 * 1000);

    await navigateToScheduleJobsListingPage(page);
    const listingTableExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
    if (listingTableExists) {

      const jobName = await navigateToExecutionHistory(page);

      const historyDataExists = await page.locator('//table[@class="clusters-list-table"]').isVisible();
      if (historyDataExists) {

        // Check the status and download the output
        const status = await page.locator('//tr[@class="cluster-list-data-parent"][1]/div/td').first().innerText();

        if (status === 'Succeeded') {
          await page.getByRole('button', { name: 'Download Output' }).first().click();

          // Check the confiramtion message
          await page.getByRole('progressbar').waitFor({ state: "detached" });
          await expect(page.getByText(jobName + ` job history downloaded successfully`)).toBeVisible();
        } else {
          const downloadButtonClass = await page.getByRole('button', { name: 'Download Output' }).first().getAttribute('class');

          // Verify the download button is disabled
          expect(downloadButtonClass).toContain('disable');

          // Ensure the status is failed or penging
          expect(['Failed', 'pending']).toContainEqual(status);

        }
      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
      }
    }
    else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });
});

