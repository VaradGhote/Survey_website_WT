import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  VStack,
  Text,
  Spinner,
  useToast,
  SimpleGrid,
  List,
  ListItem,
  Button,
  Container,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const DOMAINS = ['education', 'healthcare', 'technology', 'finance', 'retail'];

const DomainsDemo = () => {
  const { t } = useTranslation();
  const [domainQuestions, setDomainQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchQuestions = async (domain) => {
    try {
      const response = await axios.post('http://localhost:8000/generate-questions', { domain });
      const questions = response.data.questions;
      if (!Array.isArray(questions)) {
        throw new Error('Invalid questions format');
      }
      return questions;
    } catch (error) {
      console.error(`Error fetching questions for ${domain}:`, error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || `Failed to fetch questions for ${domain}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return [];
    }
  };

  useEffect(() => {
    const loadAllQuestions = async () => {
      setLoading(true);
      const questionsMap = {};
      for (const domain of DOMAINS) {
        questionsMap[domain] = await fetchQuestions(domain);
      }
      setDomainQuestions(questionsMap);
      setLoading(false);
    };

    loadAllQuestions();
  }, [toast]);

  const handleRefreshQuestions = async (domain) => {
    const questions = await fetchQuestions(domain);
    setDomainQuestions((prev) => ({ ...prev, [domain]: questions }));
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Box display="flex" justifyContent="center">
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Box bg="white" borderRadius="lg" boxShadow="xl" p={8}>
        <Heading as="h2" size="xl" mb={8} textAlign="center" color="brand.500">
          {t('domains_demo')}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {DOMAINS.map((domain) => (
            <Box key={domain} p={6} bg="gray.50" borderRadius="md" boxShadow="md">
              <VStack align="start" spacing={4}>
                <Heading as="h3" size="md" color="brand.500" textTransform="capitalize">
                  {domain}
                </Heading>
                <List spacing={3}>
                  {domainQuestions[domain]?.map((question, index) => (
                    <ListItem key={index} color="gray.700" fontSize="sm">
                      {index + 1}. {question}
                    </ListItem>
                  )) || <Text color="gray.500">No questions available</Text>}
                </List>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshQuestions(domain)}
                >
                  {t('refresh_questions')}
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default DomainsDemo;