import React, { useEffect, useCallback, useState, useRef, useDeferredValue } from 'react'
import { 
  Box,
  Button,
  Container,
  Stack,
  Input,
  Text,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Image,
  Avatar,
  HStack,
  VStack,
  Skeleton
} from '@chakra-ui/react'
import useGenerate from '../hooks/useGenerate'
import { AiFillStar } from 'react-icons/ai'
import { useGenerateImageMutation } from '../../__data__/api'

interface Comment {
  name?: string
  text?: string
  rating?: number
}

interface ProductCard {
  title?: string
  description?: string
  price?: number
  rating?: number
  comments?: Comment[]
  imagePrompt?: string
}

interface ProductData {
  catalogName: string
  imagesStyle: string
  cards: ProductCard[]
}

interface ProductCardProps {
  card: ProductCard
  imageUuid?: string
}

const ProductCard = ({ card, imageUuid }: ProductCardProps) => {
  return (
    <Card>
      <CardHeader>
        <Heading size="md">{card?.title}</Heading>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Box position="relative" width="100%" paddingBottom="100%">
            <Box position="absolute" top={0} left={0} right={0} bottom={0}>
              {!imageUuid ? (
                <Skeleton 
                  width="100%" 
                  height="100%" 
                  borderRadius="md"
                  startColor="gray.100"
                  endColor="gray.300"
                />
              ) : imageUuid ? (
                <Image
                  src={`/api/card-image/${imageUuid}`}
                  alt={card?.title}
                  borderRadius="md"
                  objectFit="cover"
                  width="100%"
                  height="100%"
                />
              ) : null}
            </Box>
          </Box>

          <Box>
            <Text color="chakra-body-text">{card?.description}</Text>
          </Box>
          
          <HStack justify="space-between">
            <Box>
              <Text fontWeight="bold" color="chakra-body-text">Цена</Text>
              <Text fontSize="xl" color="chakra-body-text">{card?.price} ₽</Text>
            </Box>
            <Box>
              <Text fontWeight="bold" color="chakra-body-text">Рейтинг</Text>
              <HStack>
                <AiFillStar color="gold" />
                <Text color="chakra-body-text">{card?.rating}</Text>
              </HStack>
            </Box>
          </HStack>

          <Box borderTop="1px" borderColor="chakra-border-color" pt={4} />
          
          <Box>
            <Text fontWeight="bold" mb={2} color="chakra-body-text">Отзывы:</Text>
            <VStack align="stretch" spacing={3}>
              {card?.comments?.map((comment, index) => (
                <Box key={index} p={2} bg="chakra-subtle-bg" borderRadius="md">
                  <HStack>
                    <Avatar size="sm" name={comment?.name} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color="chakra-body-text">{comment?.name}</Text>
                      <Text fontSize="sm" color="chakra-body-text">{comment?.text}</Text>
                      <HStack>
                        <AiFillStar color="gold" />
                        <Text fontSize="sm" color="chakra-body-text">{comment?.rating}</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}

const MemoProductCard = React.memo(ProductCard)

export const MainPage = () => {
  const { data, invoke, isGenerating } = useGenerate()
  const [generateImage] = useGenerateImageMutation()
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({})
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null)
  const generatedImagesRef = useRef<Record<number, string>>({})

  const deferredData = useDeferredValue(data?.cards ?? [])

  // Обновляем ref при изменении состояния
  useEffect(() => {
    generatedImagesRef.current = generatedImages
  }, [generatedImages])

  const generateNextImage = useCallback(async () => {
    if (!data) return

    const cards = (data as ProductData)?.cards
    const imageStyle = (data as ProductData)?.imagesStyle
    
    if (!cards || !imageStyle) return

    // Найти следующий индекс для генерации
    let nextIndex = 0
    const currentImages = generatedImagesRef.current
    while (nextIndex < cards.length && currentImages[nextIndex]) {
      nextIndex++
    }

    // Если все изображения сгенерированы, останавливаемся
    if (nextIndex >= cards.length) {
      console.log('Все изображения сгенерированы')
      setCurrentGeneratingIndex(null)
      return
    }

    setCurrentGeneratingIndex(nextIndex)
    
    try {
      const card = cards[nextIndex]
      if (card?.imagePrompt) {
        const result = await generateImage({
          imagePrompt: card.imagePrompt,
          imagesStyle: imageStyle
        }).unwrap()

        if (result?.uuid) {
          console.log('Сохранение UUID для индекса', nextIndex, ':', result.uuid)
          setGeneratedImages(prev => {
            const newState = {
              ...prev,
              [nextIndex]: result.uuid
            }
            generatedImagesRef.current = newState
            return newState
          })
          
          // Добавляем небольшую задержку перед следующей генерацией
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Переходим к следующей генерации только если текущая была успешной
          generateNextImage()
        } else {
          console.error('Failed to generate image: no UUID returned')
          setCurrentGeneratingIndex(null)
        }
      } else {
        // Если нет промпта для изображения, переходим к следующей карточке
        generateNextImage()
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      setCurrentGeneratingIndex(null)
    }
  }, [data, generateImage]) // Убрали generatedImages из зависимостей

  useEffect(() => {
    // Начинаем генерацию изображений только когда контент сгенерирован
    // и когда нет текущей генерации
    if (data && !isGenerating && currentGeneratingIndex === null && Object.keys(generatedImages).length === 0) {
      generateNextImage()
    }
  }, [data, isGenerating, currentGeneratingIndex, generateNextImage, generatedImages])

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const fields = {
      title: formData.get('title') as string,
      count: Number(formData.get('count')),
      lang: formData.get('lang') as string
    }
    setGeneratedImages({}) // Сбрасываем сгенерированные изображения при новом запросе
    setCurrentGeneratingIndex(null)
    invoke(fields)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={8}>Генерация Карточек товаров</Heading>
      <Box as="form" id="form" onSubmit={handleSubmit} mb={8}>
        <Stack spacing={4}>
          <Box>
            <Text mb={2}>Название товара:</Text>
            <Input id="title" name="title" defaultValue="Чайник" />
          </Box>

          <Box>
            <Text mb={2}>Язык:</Text>
            <select id="lang" name="lang" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <option value="ru">Russian</option>
              <option value="en">English</option>
            </select>
          </Box>

          <Box>
            <Text mb={2}>Количество карточек:</Text>
            <Input type="number" id="count" name="count" defaultValue={2} />
          </Box>

          <Button 
            type="submit" 
            colorScheme="blue" 
            size="lg"
            isLoading={isGenerating}
          >
            Generate
          </Button>
        </Stack>
      </Box>

      {deferredData && (
        <Box>
          <Heading size="lg" mb={4}>{(data as ProductData).catalogName}</Heading>
          <Text color="chakra-body-text" mb={6}>{(data as ProductData).imagesStyle}</Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {(deferredData as ProductData['cards'])?.map((card, index) => (
              <MemoProductCard 
                key={index} 
                card={card} 
                imageUuid={generatedImages[index]}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Container>
  )
}
