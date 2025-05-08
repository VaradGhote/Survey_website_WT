import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Spinner,
  useToast,
  Heading,
  Text,
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [chartUrl, setChartUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsResponse, chartResponse, questionsResponse] = await Promise.all([
          axios.get('http://localhost:8000/analytics'),
          axios.get('http://localhost:8000/chart', { responseType: 'blob' }),
          axios.get('http://localhost:8000/questions'),
        ]);
        setAnalytics(analyticsResponse.data);
        const chartBlob = new Blob([chartResponse.data], { type: 'image/png' });
        setChartUrl(URL.createObjectURL(chartBlob));
        setQuestions(questionsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleDownloadCSV = () => {
    window.location.href = 'http://localhost:8000/export-csv';
  };

  const filteredFeedbacks = analytics?.all_feedbacks?.filter((feedback) =>
    feedback.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ageChartData = {
    labels: ['0-20', '21-30', '31-40', '41-50', '51+'],
    datasets: [
      {
        label: 'Age Distribution',
        data: analytics?.age_distribution || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const userTypeChartData = {
    labels: ['Student', 'Professional', 'Other'],
    datasets: [
      {
        data: analytics?.user_type_distribution || [0, 0, 0],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const sentimentChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: analytics?.sentiment_distribution || [0, 0, 0],
        backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
      },
    ],
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={10}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} bg="gray.50" borderRadius="lg" m={4}>
      <Heading as="h2" size="lg" mb={8} textAlign="center" color="brand.500">
        Analytics Dashboard
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
        <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel fontWeight="medium" color="gray.600">{t('total_responses')}</StatLabel>
            <StatNumber color="brand.500">{analytics?.total_responses}</StatNumber>
          </Stat>
        </Box>
        <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel fontWeight="medium" color="gray.600">{t('average_age')}</StatLabel>
            <StatNumber color="brand.500">{analytics?.average_age}</StatNumber>
          </Stat>
        </Box>
        <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel fontWeight="medium" color="gray.600">Average Rating</StatLabel>
            <StatNumber color="brand.500">{analytics?.average_rating?.toFixed(2)}</StatNumber>
          </Stat>
        </Box>
      </SimpleGrid>

      {chartUrl && (
        <Box mb={10} p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Image src={chartUrl} alt="Age Distribution Chart" mx="auto" maxW="500px" />
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={10}>
        <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Bar
            data={ageChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { title: { display: true, text: 'Age Distribution', font: { size: 16 } } },
            }}
            height={300}
          />
        </Box>
        <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
          <Box maxW="300px" mx="auto">
            <Pie
              data={userTypeChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'User Type Distribution', font: { size: 16 } } },
              }}
              height={300}
            />
          </Box>
        </Box>
      </SimpleGrid>

      <Box mb={10} p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Box maxW="300px" mx="auto">
          <Pie
            data={sentimentChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { title: { display: true, text: 'Sentiment Distribution', font: { size: 16 } } },
            }}
            height={300}
          />
        </Box>
      </Box>

      <Box mb={10} p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Heading as="h3" size="md" mb={4} color="brand.600">
          Question Analytics
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Question</Th>
              <Th>Domain</Th>
              <Th>Response Count</Th>
              <Th>Avg Sentiment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {questions.map((q) => {
              const stats = analytics?.question_stats?.find((s) => s.question_id === q._id);
              return (
                <Tr key={q._id}>
                  <Td>{q.question}</Td>
                  <Td>{q.domain}</Td>
                  <Td>{stats?.response_count || 0}</Td>
                  <Td>{stats?.avg_sentiment?.toFixed(2) || '-'}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        {questions.length === 0 && (
          <Text mt={4} textAlign="center" color="gray.500">
            No questions found.
          </Text>
        )}
      </Box>

      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Input
          placeholder={t('search_feedback')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mb={4}
          borderColor="gray.300"
          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
        />
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th fontWeight="medium">{t('recent_feedback')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredFeedbacks?.map((feedback, index) => (
              <Tr key={index}>
                <Td>{feedback}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Box textAlign="center" mt={10}>
        <Button
          colorScheme="brand"
          leftIcon={<DownloadIcon />}
          onClick={handleDownloadCSV}
          size="lg"
          fontWeight="medium"
        >
          {t('download_csv')}
        </Button>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;