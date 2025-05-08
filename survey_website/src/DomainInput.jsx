import React, { useState } from 'react';
import axios from 'axios';
import { Box, Input, Button, VStack, Text, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const DomainInput = ({ onQuestionsGenerated }) => {
  const { t } = useTranslation();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleGenerateQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-questions', { domain });
      const questions = response.data.questions;
      if (!Array.isArray(questions)) {
        throw new Error('Invalid questions format');
      }
      onQuestionsGenerated(questions, domain);
      toast({
        title: 'Success',
        description: 'Questions generated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate questions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4} w="full">
      <Text fontSize="lg" fontWeight="semibold" color="gray.700">
        {t('enter_domain')}
      </Text>
      <Input
        placeholder={t('domain_placeholder')}
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        isDisabled={loading}
        bg="gray.50"
        borderColor="gray.300"
      />
      <Button
        colorScheme="brand"
        onClick={handleGenerateQuestions}
        isLoading={loading}
        isDisabled={!domain.trim()}
      >
        {t('generate_questions')}
      </Button>
    </VStack>
  );
};

export default DomainInput;