import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  Container,
  Flex,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/register', {
        username,
        password,
      });
      toast({
        title: 'Success',
        description: 'Registered successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to register',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.100">
      <Container maxW="md">
        <Box p={8} bg="white" borderRadius="lg" boxShadow="2xl">
          <Heading as="h2" size="xl" mb={6} textAlign="center" color="brand.500">
            {t('register')}
          </Heading>
          <VStack spacing={4}>
            <FormControl id="username">
              <FormLabel>{t('username')}</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('enter_username')}
                isDisabled={loading}
                bg="gray.50"
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>{t('password')}</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enter_password')}
                isDisabled={loading}
                bg="gray.50"
              />
            </FormControl>
            <Button
              colorScheme="brand"
              width="full"
              onClick={handleRegister}
              isLoading={loading}
              isDisabled={!username.trim() || !password.trim()}
            >
              {t('register')}
            </Button>
            <Text fontSize="sm" color="gray.600">
              {t('have_account')} <a href="/login" style={{ color: '#2b6cb0' }}>{t('login')}</a>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default Register;