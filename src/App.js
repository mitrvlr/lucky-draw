// src/App.js
import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Papa from 'papaparse';
import './App.css'; // 스타일링을 위한 CSS

const winterTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#90caf9', // 파란색 계열
    },
    secondary: {
      main: '#bbdefb',
    },
    background: {
      default: '#e3f2fd', // 연한 파란색 배경
      paper: '#ffffff',
    },
    text: {
      primary: '#0d47a1',
      secondary: '#1565c0',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [numWinners, setNumWinners] = useState(5); // 기본 당첨자 수
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // CSV 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (results.errors.length) {
            setError('파일 파싱 중 오류가 발생했습니다.');
            setParticipants([]);
          } else {
            // 필수 컬럼 확인
            const headers = results.meta.fields.map((field) =>
                field.trim().toLowerCase()
            );
            if (!headers.includes('번호') || !headers.includes('이름')) {
              setError('CSV 파일은 "번호"와 "이름" 컬럼을 포함해야 합니다.');
              setParticipants([]);
            } else {
              // 데이터 정제
              const cleanedData = results.data
                  .map((row) => ({
                    number: parseInt(row['번호'], 10),
                    name: row['이름'].trim(),
                  }))
                  .filter((row) => !isNaN(row.number) && row.name !== '');

              // 번호 중복 확인
              const uniqueNumbers = new Set();
              const duplicates = cleanedData.filter((row) => {
                if (uniqueNumbers.has(row.number)) {
                  return true;
                }
                uniqueNumbers.add(row.number);
                return false;
              });

              if (duplicates.length > 0) {
                setError('CSV 파일에 중복된 번호가 있습니다.');
                setParticipants([]);
              } else {
                setParticipants(cleanedData);
                setError('');
                setWinners([]);
              }
            }
          }
          setOpenSnackbar(true);
        },
      });
    }
  };

  // 럭키드로우 핸들러
  const handleDraw = () => {
    if (participants.length === 0) {
      setError('참가자가 없습니다.');
      setWinners([]);
      setOpenSnackbar(true);
      return;
    }

    if (numWinners < 1) {
      setError('당첨자 수는 최소 1명이어야 합니다.');
      setWinners([]);
      setOpenSnackbar(true);
      return;
    }

    if (numWinners > participants.length) {
      setError('당첨자 수가 참가자 수보다 많습니다.');
      setWinners([]);
      setOpenSnackbar(true);
      return;
    }

    setError('');
    setIsDrawing(true);

    // 3초 동안 스피너 애니메이션 실행 후 당첨자 선정
    setTimeout(() => {
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numWinners);
      setWinners(selected);
      setIsDrawing(false);
      setOpenSnackbar(true);
    }, 3000); // 3초
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
      <ThemeProvider theme={winterTheme}>
        <Container maxWidth="md" sx={{ mt: 5 }}>
          <Paper elevation={3} sx={{ p: 4, backgroundColor: '#e3f2fd' }}>
            <Box textAlign="center" mb={3}>
              <CasinoIcon color="primary" sx={{ fontSize: 60 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                럭키드로우
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                CSV 파일을 업로드하고 당첨자를 선정하세요!
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                    variant="contained"
                    component="label"
                    color="primary"
                    fullWidth
                    startIcon={<CasinoIcon />}
                >
                  CSV 파일 업로드
                  <input
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={handleFileUpload}
                  />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TextField
                    label="당첨자 수"
                    variant="outlined"
                    fullWidth
                    value={numWinners}
                    onChange={(e) => setNumWinners(Number(e.target.value))}
                    type="number"
                    inputProps={{ min: 1, max: 100 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleDraw}
                    disabled={isDrawing || participants.length === 0}
                    startIcon={<CasinoIcon />}
                >
                  {isDrawing ? '럭키드로우 중...' : '럭키드로우 실행'}
                </Button>
              </Grid>

              {/* CSV 업로드 후 참가자 목록을 아코디언으로 표시 */}
              {participants.length > 0 && (
                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="participants-content"
                          id="participants-header"
                      >
                        <Typography variant="h6">참가자 목록 ({participants.length}명)</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {participants.map((participant) => (
                              <ListItem key={participant.number}>
                                <ListItemText
                                    primary={`번호: ${participant.number}`}
                                    secondary={`이름: ${participant.name}`}
                                />
                              </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
              )}
            </Grid>

            {isDrawing && (
                <Box textAlign="center" mt={4}>
                  <CircularProgress color="primary" size={80} thickness={5} />
                  <Typography variant="subtitle1" color="textSecondary" mt={2}>
                    당첨 번호를 선정하는 중입니다...
                  </Typography>
                </Box>
            )}

            {!isDrawing && winners.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h5" gutterBottom>
                    당첨자 목록
                  </Typography>
                  <List>
                    {winners.map((winner, index) => (
                        <ListItem key={index}>
                          <ListItemText
                              primary={`당첨자 ${index + 1}: ${winner.number} - ${winner.name}`}
                          />
                        </ListItem>
                    ))}
                  </List>
                </Box>
            )}
          </Paper>

          <Snackbar
              open={openSnackbar}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            {error ? (
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                  {error}
                </Alert>
            ) : (
                !isDrawing && winners.length > 0 && (
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity="success"
                        sx={{ width: '100%' }}
                    >
                      럭키드로우가 성공적으로 실행되었습니다!
                    </Alert>
                )
            )}
          </Snackbar>
        </Container>
      </ThemeProvider>
  );
}

export default App;