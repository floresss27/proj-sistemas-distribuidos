package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	pb "proj-sistemas-distribuidos/redesocial"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type SocialMediaClient struct {
	client        pb.SocialNetworkClient
	ctx           context.Context
	user          string
	serverAddress string
}

func NewSocialMediaClient() (*SocialMediaClient, error) {
	client := &SocialMediaClient{
		ctx: context.Background(),
	}

	if err := client.connectToAvailableServer(); err != nil {
		return nil, err
	}

	return client, nil
}

func (c *SocialMediaClient) connectToAvailableServer() error {
	ports := []string{"50051", "50052", "50053"}

	for _, port := range ports {
		address := fmt.Sprintf("localhost:%s", port)
		fmt.Printf("Tentando conectar ao servidor em %s...\n", address)

		conn, err := grpc.Dial(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			fmt.Printf("Não foi possível conectar ao servidor em %s: %v\n", address, err)
			continue
		}

		client := pb.NewSocialNetworkClient(conn)

		_, err = client.SyncTime(c.ctx, &pb.ClockSyncRequest{
			ServerId:  "client",
			LocalTime: time.Now().Unix(),
		})

		if err != nil {
			fmt.Printf("Servidor em %s não está respondendo: %v\n", address, err)
			continue
		}

		c.client = client
		c.serverAddress = address
		fmt.Printf("Conectado ao servidor em %s\n", address)
		return nil
	}

	return fmt.Errorf("não foi possível conectar a nenhum servidor disponível")
}

func formatTimestamp(ts int64) string {
	loc, _ := time.LoadLocation("America/Sao_Paulo")
	return time.Unix(ts, 0).In(loc).Format("02/01/2006 15:04:05 MST")
}

func (c *SocialMediaClient) startNotificationListener() {
	go func() {
		for {
			stream, err := c.client.SubscribeToUpdates(c.ctx, &pb.NotificationRequest{User: c.user})
			if err != nil {
				log.Printf("Error subscribing to updates: %v", err)
				if err := c.connectToAvailableServer(); err != nil {
					log.Printf("Failed to reconnect: %v", err)
					return
				}
				continue
			}

			for {
				notification, err := stream.Recv()
				if err != nil {
					log.Printf("Error receiving notification: %v", err)
					break
				}
				fmt.Printf("\n[Notification] %s: %s (%s)\n", notification.User, notification.Content, formatTimestamp(notification.Timestamp))
			}
		}
	}()
}

func (c *SocialMediaClient) createPost(content string) error {
	post := &pb.Post{
		User:      c.user,
		Content:   content,
		Timestamp: time.Now().Unix(),
	}

	response, err := c.client.CreatePost(c.ctx, post)
	if err != nil {
		if err := c.connectToAvailableServer(); err != nil {
			return fmt.Errorf("error creating post and failed to reconnect: %v", err)
		}
		return c.createPost(content)
	}

	fmt.Printf("Post created: %s\n", response.Message)
	return nil
}

func (c *SocialMediaClient) sendDirectMessage(recipient, message string) error {
	dm := &pb.DirectMessage{
		Sender:    c.user,
		Receiver:  recipient,
		Message:   message,
		Timestamp: time.Now().Unix(),
	}

	response, err := c.client.SendDirectMessage(c.ctx, dm)
	if err != nil {
		if err := c.connectToAvailableServer(); err != nil {
			return fmt.Errorf("error sending message and failed to reconnect: %v", err)
		}
		return c.sendDirectMessage(recipient, message)
	}

	fmt.Printf("Message sent: %s\n", response.Message)
	return nil
}

func (c *SocialMediaClient) followUser(target string) error {
	request := &pb.FollowRequest{
		Follower: c.user,
		Followee: target,
	}

	response, err := c.client.ConnectUsers(c.ctx, request)
	if err != nil {
		if err := c.connectToAvailableServer(); err != nil {
			return fmt.Errorf("error following user and failed to reconnect: %v", err)
		}
		return c.followUser(target)
	}

	fmt.Printf("Follow request: %s\n", response.Message)
	return nil
}

func (c *SocialMediaClient) displayMenu() string {
	fmt.Println("\n=== Social Media Client Menu ===")
	fmt.Printf("Conectado ao servidor: %s\n", c.serverAddress)
	fmt.Println("1. Post")
	fmt.Println("2. Private Message")
	fmt.Println("3. Follow User")
	fmt.Println("4. Exit")
	fmt.Print("Select an option: ")

	reader := bufio.NewReader(os.Stdin)
	choice, _ := reader.ReadString('\n')
	return strings.TrimSpace(choice)
}

func (c *SocialMediaClient) run() {
	fmt.Print("Enter your username: ")
	reader := bufio.NewReader(os.Stdin)
	username, _ := reader.ReadString('\n')
	c.user = strings.TrimSpace(username)
	fmt.Printf("Welcome, %s!\n", c.user)

	go c.startNotificationListener()

	for {
		choice := c.displayMenu()

		switch choice {
		case "1":
			fmt.Print("Enter your post content: ")
			content, _ := reader.ReadString('\n')
			if err := c.createPost(strings.TrimSpace(content)); err != nil {
				log.Printf("Error: %v", err)
			}
		case "2":
			fmt.Print("Enter recipient username: ")
			recipient, _ := reader.ReadString('\n')
			fmt.Print("Enter your message: ")
			message, _ := reader.ReadString('\n')
			if err := c.sendDirectMessage(strings.TrimSpace(recipient), strings.TrimSpace(message)); err != nil {
				log.Printf("Error: %v", err)
			}
		case "3":
			fmt.Print("Enter username to follow: ")
			target, _ := reader.ReadString('\n')
			if err := c.followUser(strings.TrimSpace(target)); err != nil {
				log.Printf("Error: %v", err)
			}
		case "4":
			fmt.Println("Goodbye!")
			return
		default:
			fmt.Println("Invalid option. Please try again.")
		}
	}
}

func main() {
	client, err := NewSocialMediaClient()
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	client.run()
}
