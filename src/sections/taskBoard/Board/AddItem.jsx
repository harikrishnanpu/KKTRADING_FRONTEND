import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';

// third-party
import { sub } from 'date-fns';
import { Chance } from 'chance';

// project-imports
import SubCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';

import { addItem } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

// assets
import { Add, Calculator, Profile2User } from 'iconsax-react';

const chance = new Chance();

// ==============================|| KANBAN BOARD - ADD ITEM ||============================== //

export default function AddItem({ columnId }) {
  const [addTaskBox, setAddTaskBox] = useState(false);

  const handleAddTaskChange = () => {
    setAddTaskBox((prev) => !prev);
  };

  const [title, setTitle] = useState('');
  const [isTitle, setIsTitle] = useState(false);

  const handleAddTask = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      addTask();
    }
  };

  const addTask = () => {
    if (title.length > 0) {
      const newItem = {
        id: `${chance.integer({ min: 1000, max: 9999 })}`,
        title,
        dueDate: sub(new Date(), { days: 0, hours: 1, minutes: 45 }),
        image: false,
        assign: '',
        description: '',
        priority: 'low',
        attachments: []
      };

      addItem(columnId, newItem, '0');
      openSnackbar({
        open: true,
        message: 'Task Added successfully',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        variant: 'alert',
        alert: { color: 'success' }
      });
      handleAddTaskChange();
      setTitle('');
    } else {
      setIsTitle(true);
    }
  };

  const handleTaskTitle = (event) => {
    const newTitle = event.target.value;
    setTitle(newTitle);
    if (newTitle.length <= 0) {
      setIsTitle(true);
    } else {
      setIsTitle(false);
    }
  };

  return (
    <Grid container alignItems="center" spacing={1} sx={{ marginTop: 1 }}>
      {addTaskBox && (
        <Grid item xs={12}>
          <SubCard content={false}>
            <Box sx={{ p: 2, pb: 1.5, transition: 'background-color 0.25s ease-out' }}>
              <Grid container alignItems="center" spacing={0.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Add Task"
                    value={title}
                    onChange={handleTaskTitle}
                    sx={{
                      mb: 3,
                      '& input': { bgcolor: 'transparent', p: 0, borderRadius: '0px' },
                      '& fieldset': { display: 'none' },
                      '& .MuiFormHelperText-root': { ml: 0 },
                      '& .MuiOutlinedInput-root': { bgcolor: 'transparent', '&.Mui-focused': { boxShadow: 'none' } }
                    }}
                    onKeyUp={handleAddTask}
                    helperText={isTitle ? 'Task title is required.' : ''}
                    error={isTitle}
                  />
                </Grid>
                <Grid item>
                  <IconButton>
                    <Profile2User />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton>
                    <Calculator />
                  </IconButton>
                </Grid>
                <Grid item xs zeroMinWidth />
                <Grid item>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Cancel">
                      <IconButton size="small" color="error" onClick={handleAddTaskChange}>
                        <Add style={{ transform: 'rotate(45deg)' }} />
                      </IconButton>
                    </Tooltip>
                    <Button variant="outlined" color="primary" onClick={addTask} size="small">
                      Add
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </SubCard>
        </Grid>
      )}
      {!addTaskBox && (
        <Grid item xs={12}>
          <Button variant="dashed" color="secondary" fullWidth onClick={handleAddTaskChange}>
            Add Task
          </Button>
        </Grid>
      )}
    </Grid>
  );
}

AddItem.propTypes = { columnId: PropTypes.string };
