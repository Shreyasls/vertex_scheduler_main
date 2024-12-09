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

import React from 'react';
import Button from '@mui/material/Button';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
interface IDeletePopupProps {
  onCancel: () => void;
  onDelete: () => void;
  deletePopupOpen: boolean;
  DeleteMsg: string;
  deletingNotebook?: boolean;
  deletingSchedule?: boolean;
}
function DeletePopup({
  onCancel,
  onDelete,
  deletePopupOpen,
  DeleteMsg,
  deletingNotebook,
  deletingSchedule
}: IDeletePopupProps) {
  return (
    <Dialog open={deletePopupOpen} onClose={onCancel}>
      <DialogTitle>Confirm deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>{DeleteMsg}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {deletingNotebook || deletingSchedule ? (
          <div className="submit-button-disable-style">DELETING</div>
        ) : (
          <Button onClick={onDelete}>Delete</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default DeletePopup;
