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

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/login', {
        username,
        password,
      });
      localStorage.setItem('username', response.data.username);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/domains-demo');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to log in',
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
            {t('login')}
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
              onClick={handleLogin}
              isLoading={loading}
              isDisabled={!username.trim() || !password.trim()}
            >
              {t('login')}
            </Button>
            <Text fontSize="sm" color="gray.600">
              {t('no_account')} <a href="/register" style={{ color: '#2b6cb0' }}>{t('register')}</a>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default Login;